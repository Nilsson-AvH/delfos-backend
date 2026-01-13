import fs from 'fs-extra';
import path from 'path';
import hbs from 'handlebars';
import puppeteer from 'puppeteer';
import moment from 'moment';
import 'moment/locale/es.js'; 
import conversor from 'numero-a-letras';

// Modelos
import CompanyDocument from '../models/CompanyDocument.model.js';
import OperationalUser from '../models/users/UserOperational.model.js';

// Servicios
import { srvSaveCompanyFile } from '../services/storage/storage.service.js';
import { dbGetCompanyConfig } from './system/systemCompany.service.js'; // <--- VITAL: Para leer la config

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
// HELPER MAESTRO: URL -> Base64 (Sin Axios, Fetch Nativo)
// =====================================================================
const fetchImageToBase64 = async (url) => {
    if (!url || url.includes('cdn-icons-png') || url.includes('placeholder')) return null;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.warn(`⚠️ No se pudo descargar la imagen remota (${response.status}).`);
            return null;
        }
        
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

    const pdfOptions = {
        printBackground: true,
        margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' }
    };

    if (formatType !== 'custom') {
        pdfOptions.format = formatType;
    }

    const pdfBuffer = await page.pdf(pdfOptions);
    await browser.close();
    return pdfBuffer;
};

// =====================================================================
// SERVICIO: 01 Generar Contrato Laboral
// =====================================================================
const srvGenerateContract = async (userBase, contractData, adminId) => {

    // 1. Obtener Configuración Dinámica
    const companyConfig = await dbGetCompanyConfig();
    const operationalProfile = await OperationalUser.findOne({ user: userBase._id });

    if (!operationalProfile) throw new Error("El usuario no tiene un perfil operativo completo.");

    // 2. Descargar Assets desde la URL de la Empresa (BD)
    const watermarkBase64 = await fetchImageToBase64(companyConfig.watermarkUrl);
    const signatureBase64 = await fetchImageToBase64(companyConfig.signatureUrl);
    const logoBase64 = await fetchImageToBase64(companyConfig.logoUrl); // Por si lo usas en el template

    // 3. Preparar Datos
    const templateData = {
        // Imágenes Dinámicas
        watermarkImage: watermarkBase64,
        signatureImage: signatureBase64,
        logoImage: logoBase64,

        // Datos Empresa Dinámicos
        companyName: companyConfig.companyName,
        companyAddress: companyConfig.address,
        companyNit: companyConfig.nit,

        // Datos Empleado
        employeeName: userBase.fullName.toUpperCase(),
        employeeId: userBase.nuip,
        employeeIdExpedition: (operationalProfile.issuePlace || "N/A").toUpperCase(),
        employeeAddress: (operationalProfile.address || "N/A").toUpperCase(),
        employeePhone: operationalProfile.phones?.[0] || "N/A",
        employeeBirthPlace: (operationalProfile.birthPlace || "N/A").toUpperCase(),
        employeeBirthDate: operationalProfile.birthDate ? moment(operationalProfile.birthDate).format('DD/MM/YYYY') : "N/A",
        employeeNationality: (operationalProfile.nationality || "N/A").toUpperCase(),

        // Contrato
        position: (contractData.contractContent || "Cargo no especificado").toUpperCase(),
        salary: new Intl.NumberFormat('es-CO').format(contractData.contractValue),
        salaryInLetters: convertirNumero(contractData.contractValue).toUpperCase(),
        startDate: moment(contractData.startDate).format('DD [de] MMMM [de] YYYY').toUpperCase(),
        endDate: moment(contractData.endDate).format('DD [de] MMMM [de] YYYY').toUpperCase(),
        contractDuration: `${contractData.contractTermMonths} MESES`,
        workCity: (companyConfig.city || "BOGOTÁ D.C.").toUpperCase(),
        currentDate: moment().format('DD [de] MMMM [de] YYYY')
    };

    console.log(`📄 Generando Contrato para ${templateData.employeeName}...`);
    const html = await compileTemplate('contract/work-contract', templateData);
    const pdfBuffer = await createPdf(html);
    
    // Guardado Híbrido
    const storageResult = await srvSaveCompanyFile(pdfBuffer, 'delfos-official-docs', 'pdf');

    const newDoc = await CompanyDocument.create({
        user: userBase._id,
        documentType: 'ContratoLaboral',
        fileUrl: storageResult.url, 
        publicId: storageResult.publicId, 
        storageProvider: storageResult.provider,
        referenceId: contractData._id,
        generatedBy: adminId
    });

    return newDoc;
};

// =====================================================================
// SERVICIO: 02 Generar Certificación Laboral
// =====================================================================
const srvGenerateCertificate = async (userBase, adminId) => {
    
    const companyConfig = await dbGetCompanyConfig();
    const operationalProfile = await OperationalUser.findOne({ user: userBase._id })
        .populate('currentContract');

    if (!operationalProfile?.currentContract) throw new Error("No hay contrato activo.");

    // Descargar Assets Dinámicos
    const letterHeadBase64 = await fetchImageToBase64(companyConfig.letterHeadUrl);
    const signatureBase64 = await fetchImageToBase64(companyConfig.signatureUrl);

    const contract = operationalProfile.currentContract;
    const salaryText = `un salario mensual de $ ${new Intl.NumberFormat('es-CO').format(contract.contractValue)} pesos más recargos y auxilio de transporte`;

    const templateData = {
        letterheadImage: letterHeadBase64,
        signatureImage: signatureBase64,

        companyName: companyConfig.companyName,
        companyNit: companyConfig.nit,
        
        employeeName: userBase.fullName.toUpperCase(),
        employeeId: userBase.nuip,
        position: (contract.contractContent || "Guarda de Seguridad").toUpperCase(),
        startDate: moment(contract.startDate).format('DD [de] MMMM [de] YYYY'),
        salaryDetails: salaryText,
        contractType: "a término fijo",
        currentDateText: moment().format('D [días del mes de] MMMM [de] YYYY'),
        
        // Firma Dinámica
        signerName: companyConfig.legalRepresentative?.name || "REPRESENTANTE LEGAL",
        signerRole: companyConfig.legalRepresentative?.role || "GERENCIA"
    };

    console.log(`📄 Certificando a ${templateData.employeeName}...`);
    const html = await compileTemplate('certifications/labor-certificate', templateData);
    const pdfBuffer = await createPdf(html);
    const storageResult = await srvSaveCompanyFile(pdfBuffer, 'delfos-official-docs', 'pdf');

    const newDoc = await CompanyDocument.create({
        user: userBase._id,
        documentType: 'CertificadoLaboral',
        fileUrl: storageResult.url,
        publicId: storageResult.publicId,
        storageProvider: storageResult.provider,
        referenceId: contract._id,
        generatedBy: adminId
    });

    return newDoc;
};

// =====================================================================
// SERVICIO: Generar Carnet Corporativo (PUPPETEER PURO)
// =====================================================================
const srvGenerateCarnet = async (userBase, adminId) => {

    const companyConfig = await dbGetCompanyConfig();
    const operationalProfile = await OperationalUser.findOne({ user: userBase._id })
        .populate('currentContract');

    if (!operationalProfile) throw new Error("Perfil operativo incompleto.");

    // Descargar Assets Dinámicos (Fondo Frontal, Trasero y QR)
    const bgFrontBase64 = await fetchImageToBase64(companyConfig.employeeFrontCardUrl);
    const bgBackBase64 = await fetchImageToBase64(companyConfig.employeeBackCardUrl);
    const qrBase64 = await fetchImageToBase64(companyConfig.qrCodeUrl);
    
    // Foto del empleado (Si no tiene, usar fallback)
    const userPhotoUrl = operationalProfile.photo || "https://cdn-icons-png.flaticon.com/128/3135/3135715.png";
    const userPhotoBase64 = await fetchImageToBase64(userPhotoUrl);

    const templateData = {
        bgFront: bgFrontBase64,
        bgBack: bgBackBase64,
        qrImage: qrBase64,
        userPhoto: userPhotoBase64,

        surnames: `${userBase.lastName} ${userBase.secondLastName || ''}`.toUpperCase(),
        names: userBase.names.toUpperCase(),
        nuip: userBase.nuip,
        position: (operationalProfile.currentContract?.contractContent || "PERSONAL OPERATIVO").toUpperCase(),
        rh: "O+" // O conectar al campo RH si existe
    };

    console.log(`🪪 Generando Carnet para ${templateData.names}...`);
    const html = await compileTemplate('cards/employee-id', templateData);
    const pdfBuffer = await createPdf(html, 'Letter'); // Ojo con el tamaño aquí, ajusta el CSS del template

    const storageResult = await srvSaveCompanyFile(pdfBuffer, 'delfos-carnets', 'pdf');

    const newDoc = await CompanyDocument.create({
        user: userBase._id,
        documentType: 'CarnetCorporativo',
        fileUrl: storageResult.url,
        publicId: storageResult.publicId,
        storageProvider: storageResult.provider,
        referenceId: operationalProfile._id,
        generatedBy: adminId
    });

    return newDoc;
};

// =====================================================================
// SERVICIO: Generar Carta de Presentación
// =====================================================================
const srvGeneratePresentationLetter = async (userBase, manualData, adminId) => {
    
    const companyConfig = await dbGetCompanyConfig();
    const operationalProfile = await OperationalUser.findOne({ user: userBase._id })
        .populate({
            path: 'currentClient',
            populate: { path: 'clientManager', populate: { path: 'user' } }
        })
        .populate('currentContract');

    if (!operationalProfile?.currentClient) throw new Error("El usuario no tiene un Cliente asignado.");

    // Descargar Assets Dinámicos
    const letterHeadBase64 = await fetchImageToBase64(companyConfig.letterHeadUrl);
    const signatureBase64 = await fetchImageToBase64(companyConfig.signatureUrl);

    const client = operationalProfile.currentClient;
    let managerName = "ADMINISTRACIÓN"; 
    if (client.clientManager && client.clientManager.user) {
        const uMan = client.clientManager.user;
        managerName = `${uMan.names} ${uMan.lastName}`;
    }

    const templateData = {
        letterheadImage: letterHeadBase64,
        signatureImage: signatureBase64,
        
        currentDate: moment().format('D [de] MMMM [de] YYYY'),
        managerName: managerName.toUpperCase(),
        clientName: client.companyName.toUpperCase(),
        
        employeeName: userBase.fullName.toUpperCase(),
        employeeId: new Intl.NumberFormat('es-CO').format(userBase.nuip),
        
        startDate: manualData.startDate ? moment(manualData.startDate, "DD/MM/YYYY").format('D [de] MMMM [de] YYYY') : "FECHA POR DEFINIR",
        position: (operationalProfile.currentContract?.contractContent || "VIGILANTE").toUpperCase(),
    };

    console.log(`✉️ Generando Carta Presentación para ${templateData.employeeName}...`);
    const html = await compileTemplate('letters/presentation-letter', templateData);
    const pdfBuffer = await createPdf(html, 'Letter'); 
    
    const storageResult = await srvSaveCompanyFile(pdfBuffer, 'delfos-official-docs', 'pdf');

    const newDoc = await CompanyDocument.create({
        user: userBase._id,
        documentType: 'CartaPresentacion',
        fileUrl: storageResult.url,
        publicId: storageResult.publicId,
        storageProvider: storageResult.provider,
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
};