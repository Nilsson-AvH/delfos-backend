import fs from 'fs-extra';
import path from 'path';
import hbs from 'handlebars';
import puppeteer from 'puppeteer';
import { v2 as cloudinary } from 'cloudinary';
import moment from 'moment';
import 'moment/locale/es.js'; // Configurar fechas en español
import conversor from 'numero-a-letras'; // Conversor de números a letras, Importamos el paquete completo
// Modelos para guardar el rastro
import CompanyDocument from '../models/CompanyDocument.model.js';
import OperationalUser from '../models/users/UserOperational.model.js';
// Configuración global de fechas
moment.locale('es');

// =====================================================================
// HELPER: Conversor de números a letras (Conversor de números a letras)
// =====================================================================
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

// =====================================================================
// HELPER: Leer imagen LOCAL y convertir a Base64 (Para embeber en HTML)
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
// HELPER: Descargar imagen de INTERNET y convertir a Base64 (Para embeber en HTML)
// =====================================================================
const fetchImageToBase64 = async (url) => {
    try {
        // Validamos que sea una URL real
        if (!url || !url.startsWith('http')) return null;

        // Usamos 'fetch' nativo de Node.js (funciona igual que axios para esto)
        const response = await fetch(url);
        
        if (!response.ok) throw new Error(`Error fetching image: ${response.statusText}`);

        // Convertimos la respuesta a un Buffer (datos binarios)
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Convertimos a Base64
        const base64 = buffer.toString('base64');
        const mimeType = response.headers.get('content-type') || 'image/jpeg';

        return `data:${mimeType};base64,${base64}`;

    } catch (error) {
        console.error("❌ Error descargando foto remota:", error.message);
        return null; // Si falla, devolvemos null para que el carnet salga sin foto pero no rompa el proceso
    }
};

// =====================================================================
// HELPER: Compilar HTML con Datos (Handlebars)
// =====================================================================
const compileTemplate = async (templateName, data) => {
    const filePath = path.join(process.cwd(), 'src', 'templates', `${templateName}.html`);
    const html = await fs.readFile(filePath, 'utf-8');
    return hbs.compile(html)(data);
};

// =====================================================================
// HELPER: Crear PDF (Puppeteer)
// =====================================================================

const createPdf = async (htmlContent, formatType = 'Letter') => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

    // Configuración base (sin márgenes forzados por Puppeteer)
    const pdfOptions = {
        printBackground: true,
        margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' }
    };

    // LÓGICA FLEXIBLE:
    if (formatType === 'custom') {
        // Si es 'custom', NO definimos 'format' y dejamos que el @page del CSS mande.
        // Esto permite tamaños raros como el de una tarjeta de crédito.
    } else {
        // Si no, usamos el formato estándar (Letter, A4, etc.)
        pdfOptions.format = formatType;
    }

    const pdfBuffer = await page.pdf(pdfOptions);

    await browser.close();
    return pdfBuffer;
};

// =====================================================================
// HELPER: Subir a Cloudinary (Stream)
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
// SERVICIO: Generar Contrato Laboral
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

    // 4. Generar HTML
    console.log(`📄 Certificando a ${templateData.employeeName}...`);
    const html = await compileTemplate('certifications/labor-certificate', templateData); // Ojo a la ruta

    // 5. Generar PDF
    const pdfBuffer = await createPdf(html);

    // 6. Subir y Guardar
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

// =====================================================================
// SERVICIO: Generar Carnet Corporativo
// =====================================================================
const srvGenerateCarnet = async (userBase, adminId) => {

    // 1. Obtener datos Operativos y Contrato
    const operationalProfile = await OperationalUser.findOne({ user: userBase._id })
        .populate('currentContract');

    if (!operationalProfile) throw new Error("Perfil operativo incompleto.");

    // 2. Cargar IMÁGENES LOCALES (Están en tu disco -> Usamos imageToBase64)
    const bgFront = await imageToBase64('carnet-bg-front.png');
    const bgBack = await imageToBase64('carnet-bg-back.png');
    const qrImage = await imageToBase64('carnet-qr-back.png'); // QR estático

    // 3. FOTO DEL USUARIO (Está en Cloudinary -> Usamos fetchImageToBase64)
    const userPhotoUrl = operationalProfile.photo || "https://cdn-icons-png.flaticon.com/128/3135/3135715.png";

    // Aquí ocurre la magia: La descargamos antes de generar el PDF
    const userPhotoBase64 = await fetchImageToBase64(userPhotoUrl);

    // 4. Preparar Datos (Mapeo estricto a tus 4 líneas)
    const templateData = {
        bgFront,
        bgBack,
        qrImage,
        userPhoto: userPhotoBase64 || "https://cdn-icons-png.flaticon.com/128/3135/3135715.png",

        // LÍNEA 1: Apellidos (Grande) -> lastName + secondLastName
        surnames: `${userBase.lastName} ${userBase.secondLastName || ''}`.toUpperCase(),

        // LÍNEA 2: Nombres -> names
        names: userBase.names.toUpperCase(),

        // LÍNEA 3: ID -> nuip
        nuip: userBase.nuip,

        // LÍNEA 4: Cargo -> Del contrato. Fallback a "PERSONAL OPERATIVO"
        position: (operationalProfile.currentContract?.contractContent || "PERSONAL OPERATIVO").toUpperCase(),
    };

    // 5. Generar HTML HANDLEBARS
    console.log(`🪪 Generando Carnet para ${templateData.names}...`);
    const html = await compileTemplate('cards/employee-id', templateData);

    // 6. Generar PDF PUPPETEER
    // CAMBIO IMPORTANTE:
    // Aunque el CSS dice 'Letter', pasamos 'Letter' explícitamente para asegurar
    // que Puppeteer cree un canvas de ese tamaño.
    // OJO: Si usas 'custom', funcionará igual porque el CSS tiene @page { size: Letter },
    // pero usar 'Letter' aquí refuerza el estándar.
    const pdfBuffer = await createPdf(html, 'Letter');

    // 7. Subir a Cloudinary
    const cloudResult = await uploadToCloud(pdfBuffer, 'delfos-carnets');

    // 8. Guardar Registro
    const newDoc = await CompanyDocument.create({
        user: userBase._id,
        documentType: 'CarnetCorporativo',
        fileUrl: cloudResult.secure_url,
        publicId: cloudResult.public_id,
        referenceId: operationalProfile._id,
        generatedBy: adminId
    });

    return newDoc;
};

// =====================================================================
// SERVICIO: Generar Carta de Presentación
// =====================================================================
const srvGeneratePresentationLetter = async (userBase, manualData, adminId) => {
    
    // 1. Obtener datos (Vigilante -> Cliente -> Manager)
    const operationalProfile = await OperationalUser.findOne({ user: userBase._id })
        .populate({
            path: 'currentClient',
            populate: {
                path: 'clientManager',
                populate: { path: 'user' }
            }
        })
        .populate('currentContract');

    if (!operationalProfile) throw new Error("Perfil operativo no encontrado.");
    if (!operationalProfile.currentClient) throw new Error("El usuario no tiene un Cliente asignado.");

    // 2. Cargar IMÁGENES (Fondo igual al certificado + Firma)
    // ---------------------------------------------------------------------
    const letterheadImg = await imageToBase64('membrete-fondo.png'); // <--- EL MISMO FONDO
    const signatureImg = await imageToBase64('firma-elsa.png');      // <--- FIRMA
    // ---------------------------------------------------------------------

    // 3. Extraer Datos
    const client = operationalProfile.currentClient;
    
    // Fallback por si no hay manager asignado
    let managerName = "ADMINISTRACIÓN"; 
    if (client.clientManager && client.clientManager.user) {
        const uMan = client.clientManager.user;
        managerName = `${uMan.names} ${uMan.lastName}`;
    }

    // 4. Preparar Variables para HTML
    const templateData = {
        // Imágenes
        letterheadImage: letterheadImg,
        signatureImage: signatureImg,

        // Fecha Generación
        currentDate: moment().format('D [de] MMMM [de] YYYY'), // "15 de diciembre de 2025"
        
        // Destinatario
        managerName: managerName.toUpperCase(),
        clientName: client.companyName.toUpperCase(),
        
        // Cuerpo
        employeeName: `${userBase.names} ${userBase.lastName} ${userBase.secondLastName || ''}`.toUpperCase(),
        employeeId: new Intl.NumberFormat('es-CO').format(userBase.nuip),
        
        // Fecha Manual (o por defecto "FECHA POR DEFINIR")
        startDate: manualData.startDate ? moment(manualData.startDate, "DD/MM/YYYY").format('D [de] MMMM [de] YYYY') : "FECHA POR DEFINIR",
        
        // Cargo (del contrato)
        position: (operationalProfile.currentContract?.contractContent || "VIGILANTE").toUpperCase(),
    };

    // 5. Generar PDF
    console.log(`✉️ Generando Carta Presentación para ${templateData.employeeName}...`);
    const html = await compileTemplate('letters/presentation-letter', templateData);
    
    // Usamos 'Letter' para asegurar tamaño carta, pero sin márgenes de puppeteer (margin:0 en css)
    const pdfBuffer = await createPdf(html, 'Letter'); 

    // 6. Subir y Guardar
    const cloudResult = await uploadToCloud(pdfBuffer, 'delfos-official-docs');

    const newDoc = await CompanyDocument.create({
        user: userBase._id,
        documentType: 'CartaPresentacion',
        fileUrl: cloudResult.secure_url,
        publicId: cloudResult.public_id,
        referenceId: operationalProfile.currentClient._id,
        generatedBy: adminId
    });

    return newDoc;
};

export {
    srvGenerateContract,
    srvGenerateCertificate,
    srvGenerateCarnet,
    srvGeneratePresentationLetter
}