import fs from 'fs-extra';
import path from 'path';
import hbs from 'handlebars';
import puppeteer from 'puppeteer';
import { v2 as cloudinary } from 'cloudinary';
import moment from 'moment';
import 'moment/locale/es.js'; // Configurar fechas en español
import conversor from 'numero-a-letras'; // Conversor de números a letras, Importamos el paquete completo

// Hacemos una función "puente" que detecta cómo vino la librería
// ... import conversor ...
const convertirNumero = (num) => {
    let texto = "";

    // 1. Obtener el texto crudo (Detectando la función correcta)
    if (conversor.NumerosALetras) {
        texto = conversor.NumerosALetras(num);
    } else if (typeof conversor === 'function') {
        texto = conversor(num); // Caso fallback
    } else if (conversor.default && conversor.default.NumerosALetras) {
        texto = conversor.default.NumerosALetras(num);
    } else {
        return "ERROR DE LIBRERÍA";
    }

    // 2. "Colombianizar" el texto 🇨🇴
    // La librería devuelve: "UN MILLÓN ... PESOS 00/100 M.N."
    // Nosotros queremos: "UN MILLÓN ... PESOS M/CTE"
    return texto
        .replace("00/100 M.N.", "M/CTE") // Cambia el final mexicano por el colombiano
        .replace("M.N.", "M/CTE")        // Por si acaso sale sin centavos
        .toUpperCase();
};
// ------------------

// Modelos para guardar el rastro
import CompanyDocument from '../models/CompanyDocument.model.js';
import OperationalUser from '../models/users/UserOperational.model.js';

// Configuración global de fechas
moment.locale('es');

// =====================================================================
// HELPER: Leer imagen y convertir a Base64 (Para embeber en HTML)
// =====================================================================
const imageToBase64 = async (imageName) => {
    try {
        // Construimos la ruta a src/assets/images/nombre.ext
        const imagePath = path.join(process.cwd(), 'src', 'assets', 'images', imageName);

        // Leemos el archivo como un Buffer binario
        const imageBuffer = await fs.readFile(imagePath);

        // Convertimos a string base64
        const base64Image = Buffer.from(imageBuffer).toString('base64');

        // Detectamos el tipo (para el prefijo correcto)
        const ext = path.extname(imageName).toLowerCase();
        const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';

        // Devolvemos la cadena lista para poner en el src="" del HTML
        return `data:${mimeType};base64,${base64Image}`;

    } catch (error) {
        console.error(`❌ Error leyendo imagen ${imageName}:`, error);
        return null; // Devuelve null si falla, para que no rompa todo
    }
};

// =====================================================================
// HELPER 1: Compilar HTML con Datos (Handlebars)
// =====================================================================
const compileTemplate = async (templateName, data) => {
    const filePath = path.join(process.cwd(), 'src', 'templates', `${templateName}.html`);
    const html = await fs.readFile(filePath, 'utf-8');
    return hbs.compile(html)(data);
};

// =====================================================================
// HELPER 2: Crear PDF (Puppeteer)
// =====================================================================
const createPdf = async (htmlContent) => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // Vital para servidores Linux
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

    const pdfBuffer = await page.pdf({
        format: 'Letter', // <--- CAMBIO 1: Aseguramos tamaño CARTA (estaba A4)
        printBackground: true,
        // CAMBIO 2: QUITAMOS LOS MÁRGENES DE AQUÍ
        // Dejamos que el CSS (@page { margin: 0 }) controle todo.
        margin: {
            top: '0px',
            bottom: '0px',
            left: '0px',
            right: '0px'
        }
    });

    await browser.close();
    return pdfBuffer;
};

// =====================================================================
// HELPER 3: Subir a Cloudinary (Stream)
// =====================================================================
const uploadToCloud = (buffer, folderName) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folderName,
                resource_type: 'raw', // 'raw' evita que Cloudinary trate de comprimirlo como imagen
                format: 'pdf'
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        uploadStream.end(buffer);
    });
};

// =====================================================================
// SERVICIO PRINCIPAL: Generar Contrato Laboral
// =====================================================================
const srvGenerateContract = async (userBase, contractData, adminId) => {

    // 1. Necesitamos datos del Perfil Operativo (Dirección, Teléfono, Lugar Nacimiento)
    // El 'userBase' solo tiene Nombres y Email. Buscamos el resto:
    const operationalProfile = await OperationalUser.findOne({ user: userBase._id });

    if (!operationalProfile) {
        throw new Error("El usuario no tiene un perfil operativo completo (Faltan dirección, huella, etc).");
    };

    // --- NUEVO: CARGAR MARCA DE AGUA ---
    // Usamos la misma función helper que creamos antes
    const watermarkBase64 = await imageToBase64('escudo-marca-agua.png');
    // ------------------------------------

    // 2. Preparar (Mapear) los datos para la plantilla
    // USAMOS "||" PARA EVITAR EL ERROR DE 'toUpperCase' SI EL DATO FALTA
    const templateData = {

        // --- NUEVA VARIABLE PARA EL HTML ---
        watermarkImage: watermarkBase64,
        // -----------------------------------

        // --- EMPRESA ---
        companyName: "SEGURIDAD DELFOS LTDA",
        companyAddress: "CARRERA 49 No. 145 B 03 Santa H de Baviera",
        companyNit: "830.100.549-1",

        // --- TRABAJADOR ---
        employeeName: `${userBase.names} ${userBase.lastName} ${userBase.secondLastName}`.toUpperCase(),
        employeeId: userBase.nuip,
        // Si no tiene lugar de expedición, pone "N/A"
        employeeIdExpedition: (operationalProfile.issuePlace || "N/A").toUpperCase(),
        employeeAddress: (operationalProfile.address || "N/A").toUpperCase(),
        employeePhone: operationalProfile.phones?.[0] || "N/A",

        employeeBirthPlace: (operationalProfile.birthPlace || "N/A").toUpperCase(),
        employeeBirthDate: operationalProfile.birthDate ? moment(operationalProfile.birthDate).format('DD/MM/YYYY') : "N/A",
        employeeNationality: (operationalProfile.nationality || "N/A").toUpperCase(),

        // --- CONTRATO ---
        // ¡AQUÍ ESTÁ EL CULPABLE PROBABLE! (Si el contrato es viejo, no tiene position)
        position: (contractData.contractContent || "Cargo no especificado").toUpperCase(),

        salary: new Intl.NumberFormat('es-CO').format(contractData.contractValue),
        salaryInLetters: convertirNumero(contractData.contractValue).toUpperCase(),

        startDate: moment(contractData.startDate).format('DD [de] MMMM [de] YYYY').toUpperCase(),
        endDate: moment(contractData.endDate).format('DD [de] MMMM [de] YYYY').toUpperCase(),
        contractDuration: `${contractData.contractTermMonths} MESES`,

        workCity: "BOGOTÁ D.C.",
        currentDate: moment().format('DD [de] MMMM [de] YYYY')
    };

    // 3. Compilar HTML
    console.log(`📄 Generando HTML para ${templateData.employeeName}...`);
    const html = await compileTemplate('contract/work-contract', templateData);

    // 4. Crear PDF
    console.log(`🖨️ Imprimiendo PDF en memoria...`);
    const pdfBuffer = await createPdf(html);

    // 5. Subir a Cloudinary
    console.log(`☁️ Subiendo a Cloudinary...`);
    const cloudResult = await uploadToCloud(pdfBuffer, 'delfos-official-docs');

    // 6. Guardar Registro Oficial en la BD
    const newDoc = await CompanyDocument.create({
        user: userBase._id,
        documentType: 'ContratoLaboral',
        fileUrl: cloudResult.secure_url, // Link seguro
        publicId: cloudResult.public_id, // ID para borrar luego
        referenceId: contractData._id,   // Vinculado a este contrato específico
        generatedBy: adminId
    });

    console.log(`✅ Contrato generado y guardado: ${newDoc._id}`);
    return newDoc;
};

// =====================================================================
// SERVICIO: Generar Certificación Laboral
// =====================================================================
const srvGenerateCertificate = async (userBase, adminId) => {

    // 1. Buscamos Datos Operativos y Contrato Actual
    const operationalProfile = await OperationalUser.findOne({ user: userBase._id })
        .populate('currentContract'); // Necesitamos saber sueldo y cargo actual

    if (!operationalProfile) throw new Error("El usuario no tiene perfil operativo.");

    // Validar si tiene contrato activo
    const contract = operationalProfile.currentContract;
    if (!contract) throw new Error("El usuario no tiene un contrato activo para certificar.");

    // --- NUEVO: CARGAR LA IMAGEN DE FONDO ---
    const backgroundImgBase64 = await imageToBase64('membrete-fondo.png');
    // ----------------------------------------

    // 2. Definir texto del Salario (Dinámico)
    // Opción A: Texto exacto del Word ("salario mínimo...")
    // Opción B: Salario real del contrato ("un salario mensual de $1.800.000...")
    // Vamos a usar la Opción B que es más precisa, o puedes cambiarlo a texto fijo si prefieres.
    const salaryText = `un salario mensual de $ ${new Intl.NumberFormat('es-CO').format(contract.contractValue)} pesos más recargos y auxilio de transporte`;

    // 3. Preparar Datos
    const templateData = {

        // --- NUEVA VARIABLE ---
        letterheadImage: backgroundImgBase64, // Pasamos el string gigante
        // ----------------------

        companyName: "SEGURIDAD DELFOS LTDA",
        companyNit: "830.100.549-1",

        employeeName: `${userBase.names} ${userBase.lastName} ${userBase.secondLastName}`.toUpperCase(),
        employeeId: userBase.nuip,

        position: (contract.contractContent || "Guarda de Seguridad").toUpperCase(), // Usamos el del contrato o fallback

        // Fecha de inicio: Idealmente usamos la fecha de ingreso histórica. 
        // Si no tenemos ese campo específico, usamos la del contrato actual como fallback.
        startDate: moment(contract.startDate).format('DD [de] MMMM [de] YYYY'),

        salaryDetails: salaryText,
        contractType: "a término fijo", // Puedes hacerlo dinámico si tienes ese dato en el modelo

        // Fecha actual en formato texto largo: "15 días del mes de octubre de 2025"
        currentDateText: moment().format('D [días del mes de] MMMM [de] YYYY'),

        signerName: "ELSA RIVILLAS VERGARA",
        signerRole: "Talento Humano"
    };

    // 4. Generar
    console.log(`📄 Certificando a ${templateData.employeeName}...`);
    const html = await compileTemplate('certifications/labor-certificate', templateData); // Ojo a la ruta
    const pdfBuffer = await createPdf(html);

    // 5. Subir y Guardar
    const cloudResult = await uploadToCloud(pdfBuffer, 'delfos-official-docs');

    const newDoc = await CompanyDocument.create({
        user: userBase._id,
        documentType: 'CertificadoLaboral', // <--- Tipo diferente
        fileUrl: cloudResult.secure_url,
        publicId: cloudResult.public_id,
        referenceId: contract._id,
        generatedBy: adminId
    });

    return newDoc;
};

export {
    srvGenerateContract,
    srvGenerateCertificate
}