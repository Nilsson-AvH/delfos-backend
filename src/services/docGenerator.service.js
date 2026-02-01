import fs from 'fs-extra';
import path from 'path';
import hbs from 'handlebars';
import puppeteer from 'puppeteer';
import moment from 'moment';
import 'moment/locale/es.js';
import conversor from 'numero-a-letras';

// 👇 SEGURIDAD (Crypto para Hash y UUID para CUD)
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

// Modelos
import CompanyDocument from '../models/CompanyDocument.model.js';
import OperationalUser from '../models/users/UserOperational.model.js';
import User from '../models/users/User.model.js'; // Usuario Base
import AdministrativeUser from '../models/users/UserAdministrative.model.js'; // Perfil Admin

// Servicios
import { srvSaveCompanyFile } from '../services/storage/storage.service.js';
import { dbGetCompanyConfig } from './system/systemCompany.service.js';

// Configuración global de fechas
moment.locale('es');

// =====================================================================
// HELPER: Conversor de números a letras
// =====================================================================
const convertirNumero = (num) => {
    let texto = "";
    if (conversor.NumerosALetras) {
        texto = conversor.NumerosALetras(num);
    } else if (typeof conversor === 'function') {
        texto = conversor(num);
    } else if (conversor.default && conversor.default.NumerosALetras) {
        texto = conversor.default.NumerosALetras(num);
    } else {
        return "ERROR DE LIBRERÍA";
    }
    return texto.replace("00/100 M.N.", "M/CTE").replace("M.N.", "M/CTE").toUpperCase();
};

// =====================================================================
// HELPER: Descargar URL -> Base64 (Para Puppeteer)
// =====================================================================
const fetchImageToBase64 = async (url) => {
    if (!url || url.includes('cdn-icons-png') || url.includes('placeholder')) return null;
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = response.headers.get('content-type') || 'image/png';
        return `data:${mimeType};base64,${buffer.toString('base64')}`;
    } catch (error) {
        console.warn(`⚠️ Error descargando imagen (${url}):`, error.message);
        return null;
    }
};

// =====================================================================
// HELPER: Generar Metadatos de Seguridad (HASH + CUD)
// =====================================================================
const generateSecurityMetadata = (dataObject) => {
    // 1. Crear string canónico con los datos
    const dataString = JSON.stringify(dataObject);

    // 2. Generar Hash SHA-256
    const securityHash = crypto.createHash('sha256').update(dataString).digest('hex');

    // 3. Generar CUD (Código corto para imprimir)
    const cud = uuidv4().split('-')[0].toUpperCase(); // Ej: "A1B2C3D4"

    return { securityHash, cud };
};

// =====================================================================
// HELPER: Compilar HTML con Handlebars
// =====================================================================
const compileTemplate = async (templateName, data) => {
    const filePath = path.join(process.cwd(), 'src', 'templates', `${templateName}.html`);
    const html = await fs.readFile(filePath, 'utf-8');
    return hbs.compile(html)(data);
};

// =====================================================================
// HELPER: Crear PDF con Puppeteer
// =====================================================================
const createPdf = async (htmlContent, formatType = 'Letter') => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

    // Márgenes CERO para que el membrete ocupe todo el fondo
    const pdfBuffer = await page.pdf({
        format: formatType,
        printBackground: true,
        margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' }
    });

    await browser.close();
    return pdfBuffer;
};


// =====================================================================
// SERVICIO 01: CONTRATO (CON HASH Y CUD) ✅
// =====================================================================
const srvGenerateContract = async (userBase, contractData, adminId, reqInfo = {}) => {
    const companyConfig = await dbGetCompanyConfig();
    const operationalProfile = await OperationalUser.findOne({ user: userBase._id })
        .populate('currentContract');
    if (!operationalProfile) throw new Error("Perfil operativo incompleto.");

    // ✅ SI NO VIENE contractData, USAR EL CONTRATO ACTUAL DE LA BD
    const contract = contractData._id
        ? contractData // Si ya viene el objeto completo, usarlo
        : operationalProfile.currentContract; // Si no, usar el actual del perfil

    // Validar que tengamos un contrato
    if (!contract || !contract.startDate || !contract.endDate) {
        throw new Error("No se encontró un contrato válido con fechas.");
    }

    // 1. GENERAR SEGURIDAD (HASH + CUD)
    const { securityHash, cud } = generateSecurityMetadata({
        docType: 'CONTRATO_LABORAL',
        companyNit: companyConfig.nit,
        employeeId: userBase.nuip,
        contractValue: contract.contractValue,
        startDate: contract.startDate,
        timestamp: new Date().toISOString()
    });

    // 2. ASSETS
    const watermarkBase64 = await fetchImageToBase64(companyConfig.watermarkUrl);
    const signatureBase64 = await fetchImageToBase64(companyConfig.signatureUrl); // Contrato firma el Rep Legal por defecto
    const logoBase64 = await fetchImageToBase64(companyConfig.logoUrl);

    // console.log(contract.startDate);
    // console.log(contract.endDate);

    // 3. PREPARAR DATOS
    const templateData = {
        // Datos de Seguridad (Para el pie de página)
        securityHash,
        cud,
        generationDate: moment().format('DD/MM/YYYY HH:mm:ss'),

        // Visuales
        watermarkImage: watermarkBase64,
        signatureImage: signatureBase64,
        logoImage: logoBase64,

        // Empresa
        companyName: companyConfig.companyName,
        companyAddress: companyConfig.address,
        companyNit: companyConfig.nit,

        // Empleado
        employeeName: userBase.fullName.toUpperCase(),
        employeeId: userBase.nuip,
        employeeIdExpedition: (operationalProfile.issuePlace || "N/A").toUpperCase(),
        employeeAddress: (operationalProfile.address || "N/A").toUpperCase(),
        employeePhone: operationalProfile.phones?.[0] || "N/A",
        employeeBirthPlace: (operationalProfile.birthPlace || "N/A").toUpperCase(),
        employeeBirthDate: operationalProfile.birthDate ? moment(operationalProfile.birthDate).format('DD/MM/YYYY') : "N/A",
        employeeNationality: (operationalProfile.nationality || "N/A").toUpperCase(),

        // Contrato        
        position: (contract.jobTitle || "Cargo no especificado").toUpperCase(),
        salary: new Intl.NumberFormat('es-CO').format(contract.contractValue),
        salaryInLetters: convertirNumero(contract.contractValue).toUpperCase(),
        startDate: moment.utc(contract.startDate).format('DD [de] MMMM [de] YYYY').toUpperCase(),
        endDate: moment.utc(contract.endDate).format('DD [de] MMMM [de] YYYY').toUpperCase(),
        contractDuration: `${contract.contractTermMonths} MESES`,
        workCity: (companyConfig.city || "BOGOTÁ D.C.").toUpperCase(),
        currentDate: moment().format('DD [de] MMMM [de] YYYY'),
        content: contract.contractContent,
    };

    // console.log(templateData.startDate);
    // console.log(templateData.endDate);

    console.log(`📄 Generando Contrato Seguro (${cud})...`);

    // Nota: Asegúrate de actualizar tu HTML de contrato (contract/work-contract) 
    // para mostrar las variables {{cud}} y {{securityHash}} en el footer.
    const html = await compileTemplate('contract/work-contract', templateData);
    const pdfBuffer = await createPdf(html);
    const storageResult = await srvSaveCompanyFile(pdfBuffer, 'delfos-official-docs', 'pdf');

    // 4. Guardar en la colección CompanyDocument
    return await CompanyDocument.create({
        user: userBase._id,
        documentType: 'ContratoLaboral',
        fileUrl: storageResult.url,
        publicId: storageResult.publicId,
        storageProvider: storageResult.provider,
        referenceId: contract._id,
        generatedBy: adminId,
        securityHash, // <--- Guardamos la evidencia
        cud,
        signedAtIP: reqInfo.ip,
        userAgent: reqInfo.userAgent
    });
};


// =====================================================================
// SERVICIO 02: CERTIFICACIÓN LABORAL (CORREGIDO: FIRMANTE DINÁMICO) ✅
// =====================================================================
const srvGenerateCertificate = async (userBase, adminId, reqInfo = {}) => {

    const companyConfig = await dbGetCompanyConfig();
    const operationalProfile = await OperationalUser.findOne({ user: userBase._id }).populate('currentContract');
    if (!operationalProfile?.currentContract) throw new Error("No hay contrato activo.");

    // 1. CONFIGURAR FIRMANTE POR DEFECTO (Rep. Legal)
    // Estos valores se usan si NO se encuentra un admin válido.
    let finalSignerName = companyConfig.legalRepresentative?.name || "REPRESENTANTE LEGAL";
    let finalSignerRole = companyConfig.legalRepresentative?.role || "GERENCIA";
    let finalSignatureUrl = companyConfig.signatureUrl;

    // 2. INTENTAR USAR DATOS DEL ADMINISTRADOR LOGUEADO
    if (adminId) {
        const adminProfile = await AdministrativeUser.findOne({ user: adminId }).populate('user');

        // CORRECCIÓN: Si existe el perfil administrativo, usamos SUS datos de identidad SIEMPRE.
        if (adminProfile) {
            finalSignerName = adminProfile.user.fullName.toUpperCase();
            // Si tiene cargo, lo usamos, si no, genérico
            finalSignerRole = adminProfile.jobTitle ? adminProfile.jobTitle.toUpperCase() : "ADMINISTRATIVO";

            // Lógica específica para la IMAGEN de la firma
            if (adminProfile.signatureUrl) {
                finalSignatureUrl = adminProfile.signatureUrl; // Firma digital disponible
            } else {
                finalSignatureUrl = null; // Sin imagen -> Espacio para firma manual
                // Importante: No hacemos fallback a la firma de la empresa porque el nombre es del admin
            }
        }
    }

    // 3. GENERAR SEGURIDAD (HASH + CUD)
    const { securityHash, cud } = generateSecurityMetadata({
        docType: 'CERTIFICACION_LABORAL',
        companyNit: companyConfig.nit,
        employeeId: userBase.nuip,
        signer: finalSignerName,
        timestamp: new Date().toISOString()
    });

    // 4. ASSETS
    const letterHeadBase64 = await fetchImageToBase64(companyConfig.letterHeadUrl);
    // fetchImageToBase64 maneja 'null' devolviendo null, así que el template no renderiza <img>
    const signatureBase64 = await fetchImageToBase64(finalSignatureUrl); // <--- Firma decidida

    const contract = operationalProfile.currentContract;
    const salaryText = `un salario mensual de $ ${new Intl.NumberFormat('es-CO').format(contract.contractValue)} pesos más recargos y auxilio de transporte`;

    // 5. PREPARAR DATOS
    const templateData = {
        // Seguridad
        securityHash, cud, generationDate: moment().format('DD/MM/YYYY HH:mm:ss'),

        // Imágenes
        letterheadImage: letterHeadBase64,
        signatureImage: signatureBase64,

        // Firmante
        signerName: finalSignerName,
        signerRole: finalSignerRole,

        // Datos del documento
        companyName: companyConfig.companyName,
        companyNit: companyConfig.nit,
        employeeName: userBase.fullName.toUpperCase(),
        employeeId: userBase.nuip,
        position: (contract.jobTitle || "Guarda de Seguridad").toUpperCase(),
        startDate: moment.utc(contract.startDate).format('DD [de] MMMM [de] YYYY'),
        salaryDetails: salaryText,
        contractType: "a término fijo",
        currentDateText: moment().format('D [días del mes de] MMMM [de] YYYY')
    };

    console.log(`📄 Certificando (${cud}) firmado por ${finalSignerName}...`);
    const html = await compileTemplate('certifications/labor-certificate', templateData);
    const pdfBuffer = await createPdf(html);
    const storageResult = await srvSaveCompanyFile(pdfBuffer, 'delfos-official-docs', 'pdf');

    // Guardar en la colección CompanyDocument
    return await CompanyDocument.create({
        user: userBase._id,
        documentType: 'CertificadoLaboral',
        fileUrl: storageResult.url,
        publicId: storageResult.publicId,
        storageProvider: storageResult.provider,
        referenceId: contract._id,
        generatedBy: adminId,
        securityHash,
        cud,
        signedAtIP: reqInfo.ip,
        userAgent: reqInfo.userAgent
    });
};

// =====================================================================
// SERVICIO 03: CARNET CORPORATIVO (SIN HASH VISIBLE) 🪪
// =====================================================================
const srvGenerateCarnet = async (userBase, adminId, reqInfo = {}) => {

    const companyConfig = await dbGetCompanyConfig();

    // 1. GENERAR SEGURIDAD (HASH + CUD)
    const { securityHash, cud } = generateSecurityMetadata({
        docType: 'CARNET_CORPORATIVO',
        companyNit: companyConfig.nit,
        employeeId: userBase.nuip,
        timestamp: new Date().toISOString()
    });

    const operationalProfile = await OperationalUser.findOne({ user: userBase._id }).populate('currentContract');
    if (!operationalProfile) throw new Error("Perfil operativo incompleto.");

    const bgFrontBase64 = await fetchImageToBase64(companyConfig.employeeFrontCardUrl);
    const bgBackBase64 = await fetchImageToBase64(companyConfig.employeeBackCardUrl);
    const qrBase64 = await fetchImageToBase64(companyConfig.qrCodeUrl);
    const userPhotoUrl = userBase.photo || "https://cdn-icons-png.flaticon.com/128/3135/3135715.png";
    const userPhotoBase64 = await fetchImageToBase64(userPhotoUrl);

    const templateData = {
        // Seguridad
        securityHash, cud, generationDate: moment().format('DD/MM/YYYY HH:mm:ss'),

        bgFront: bgFrontBase64, bgBack: bgBackBase64, qrImage: qrBase64, userPhoto: userPhotoBase64,
        surnames: `${userBase.lastName} ${userBase.secondLastName || ''}`.toUpperCase(),
        names: userBase.names.toUpperCase(),
        nuip: userBase.nuip,
        position: (operationalProfile.currentContract?.jobTitle || "PERSONAL OPERATIVO").toUpperCase(),
        rh: "O+"
    };

    const html = await compileTemplate('cards/employee-id', templateData);
    const pdfBuffer = await createPdf(html, 'Letter');
    const storageResult = await srvSaveCompanyFile(pdfBuffer, 'delfos-carnets', 'pdf');

    // Guardar en la colección CompanyDocument
    return await CompanyDocument.create({
        user: userBase._id,
        documentType: 'CarnetCorporativo',
        fileUrl: storageResult.url,
        publicId: storageResult.publicId,
        storageProvider: storageResult.provider,
        referenceId: operationalProfile._id,
        generatedBy: adminId,
        securityHash,
        cud,
        signedAtIP: reqInfo.ip,
        userAgent: reqInfo.userAgent
    });
};


// =====================================================================
// SERVICIO 04: CARTA PRESENTACIÓN (CORREGIDO: FIRMANTE DINÁMICO) ✅
// =====================================================================
const srvGeneratePresentationLetter = async (userBase, manualData, adminId, reqInfo = {}) => {

    const companyConfig = await dbGetCompanyConfig();
    const operationalProfile = await OperationalUser.findOne({ user: userBase._id })
        .populate({
            path: 'currentClient',
            populate: { path: 'clientManager', populate: { path: 'user' } }
        })
        .populate('currentContract');

    if (!operationalProfile?.currentClient) throw new Error("El usuario no tiene un Cliente asignado.");

    // 1. CONFIGURAR FIRMANTE POR DEFECTO
    let finalSignerName = companyConfig.legalRepresentative?.name || "REPRESENTANTE LEGAL";
    let finalSignerRole = companyConfig.legalRepresentative?.role || "GERENCIA";
    let finalSignatureUrl = companyConfig.signatureUrl;

    // 2. INTENTAR USAR DATOS DEL ADMINISTRADOR LOGUEADO
    if (adminId) {
        const adminProfile = await AdministrativeUser.findOne({ user: adminId }).populate('user');

        // CORRECCIÓN: Usamos identidad del admin siempre si existe.
        if (adminProfile) {
            finalSignerName = adminProfile.user.fullName.toUpperCase();
            finalSignerRole = adminProfile.jobTitle ? adminProfile.jobTitle.toUpperCase() : "ADMINISTRATIVO";

            // Si tiene firma la ponemos, si no, espacio en blanco (null)
            if (adminProfile.signatureUrl) {
                finalSignatureUrl = adminProfile.signatureUrl;
            } else {
                finalSignatureUrl = null;
            }
        }
    }

    // 3. SEGURIDAD (HASH + CUD)
    const { securityHash, cud } = generateSecurityMetadata({
        docType: 'CARTA_PRESENTACION',
        client: operationalProfile.currentClient._id,
        employee: userBase.nuip,
        signer: finalSignerName,
        timestamp: new Date().toISOString()
    });

    // 4. ASSETS
    const letterHeadBase64 = await fetchImageToBase64(companyConfig.letterHeadUrl);
    const signatureBase64 = await fetchImageToBase64(finalSignatureUrl); // Firma Dinámica

    const client = operationalProfile.currentClient;
    let managerName = "ADMINISTRACIÓN";
    if (client.clientManager && client.clientManager.user) {
        const uMan = client.clientManager.user;
        managerName = `${uMan.names} ${uMan.lastName}`;
    }

    const templateData = {
        // Seguridad
        securityHash, cud, generationDate: moment().format('DD/MM/YYYY HH:mm:ss'),

        // Imágenes
        letterheadImage: letterHeadBase64,
        signatureImage: signatureBase64,

        // Firmante
        signerName: finalSignerName,
        signerRole: finalSignerRole,

        // Contenido
        currentDate: moment().format('DD [de] MMMM [de] YYYY.'),
        managerName: managerName.toUpperCase(),
        clientName: client.companyName.toUpperCase(),
        employeeName: userBase.fullName.toUpperCase(),
        employeeId: new Intl.NumberFormat('es-CO').format(userBase.nuip),
        startDate: manualData.startDate ? moment(manualData.startDate, "DD/MM/YYYY").format('D [de] MMMM [de] YYYY') : "FECHA POR DEFINIR",
        position: (operationalProfile.currentContract?.jobTitle || "VIGILANTE").toUpperCase(),
        companyName: companyConfig.companyName || "EMPRESA"
    };

    console.log(`✉️ Generando Carta (${cud}) firmada por ${finalSignerName}...`);
    const html = await compileTemplate('letters/presentation-letter', templateData);
    const pdfBuffer = await createPdf(html, 'Letter');

    const storageResult = await srvSaveCompanyFile(pdfBuffer, 'delfos-official-docs', 'pdf');

    return await CompanyDocument.create({
        user: userBase._id,
        documentType: 'CartaPresentacion',
        fileUrl: storageResult.url,
        publicId: storageResult.publicId,
        storageProvider: storageResult.provider,
        referenceId: operationalProfile.currentClient._id,
        generatedBy: adminId,
        securityHash,
        cud,
        signedAtIP: reqInfo.ip,
        userAgent: reqInfo.userAgent
    });
};

export {
    srvGenerateContract,
    srvGenerateCertificate,
    srvGenerateCarnet,
    srvGeneratePresentationLetter
};