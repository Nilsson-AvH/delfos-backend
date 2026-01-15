import { 
    srvGenerateContract, 
    srvGenerateCertificate, 
    srvGenerateCarnet, 
    srvGeneratePresentationLetter } from '../services/docGenerator.service.js';
import Contract from '../models/Contract.model.js';
import User from '../models/users/User.model.js';

// =====================================================================
// HELPER: Capturar Trazabilidad (IP y Dispositivo) 🕵️‍♂️
// =====================================================================
const getTraceabilityInfo = (req) => {
    return {
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || 'Unknown IP',
        userAgent: req.get('User-Agent') || 'Unknown Device'
    };
};

// =====================================================================
// POST: Generar Contrato PDF
// =====================================================================
const generateContractPDF = async (req, res) => {
    try {
        const { userId, contractId } = req.body;

        const user = await User.findById(userId);
        const contract = await Contract.findById(contractId);

        if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });
        if (!contract) return res.status(404).json({ msg: "Contrato no encontrado (Crea primero el registro de datos)" });

        const adminId = req.userId;
        
        // 👇 1. Capturamos la evidencia
        const reqInfo = getTraceabilityInfo(req);

        // 👇 2. La pasamos al servicio
        const generatedDoc = await srvGenerateContract(user, contract, adminId, reqInfo);

        contract.attachedDocument = generatedDoc._id;
        await contract.save();

        res.status(201).json({
            msg: "Contrato generado exitosamente",
            url: generatedDoc.fileUrl,
            document: generatedDoc
        });

    } catch (error) {
        console.error("❌ Error generando contrato:", error);
        res.status(500).json({ msg: "Error generando contrato", error: error.message });
    }
};

// =====================================================================
// POST: Generar Certificación Laboral PDF
// =====================================================================
const generateLaborCertificatePDF = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

        const adminId = req.userId;
        const reqInfo = getTraceabilityInfo(req); // <--- Captura

        // Pasamos reqInfo al servicio
        const generatedDoc = await srvGenerateCertificate(user, adminId, reqInfo);

        res.status(201).json({
            msg: "Certificación generada exitosamente",
            url: generatedDoc.fileUrl,
            document: generatedDoc
        });

    } catch (error) {
        console.error("❌ Error certificando:", error);
        res.status(500).json({ msg: "Error generando certificación", error: error.message });
    }
};

// =====================================================================
// POST: Generar Carnet PDF
// =====================================================================
const generateCarnetPDF = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

        const adminId = req.userId;
        const reqInfo = getTraceabilityInfo(req); // <--- Captura

        // Pasamos reqInfo
        const generatedDoc = await srvGenerateCarnet(user, adminId, reqInfo);

        res.status(201).json({
            msg: "Carnet generado exitosamente",
            url: generatedDoc.fileUrl,
            document: generatedDoc
        });

    } catch (error) {
        console.error("❌ Error generando carnet:", error);
        res.status(500).json({ msg: "Error generando carnet", error: error.message });
    }
};

// =====================================================================
// POST: Generar Carta de Presentación
// =====================================================================
const generatePresentationLetterPDF = async (req, res) => {
    try {
        const { userId, startDate } = req.body; 

        if (!userId) return res.status(400).json({ msg: "El userId es obligatorio." });
        if (!startDate) return res.status(400).json({ msg: "La fecha de inicio (startDate) es obligatoria." });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: "Usuario no encontrado." });

        const adminId = req.userId;
        const reqInfo = getTraceabilityInfo(req); // <--- Captura

        // Pasamos reqInfo
        const generatedDoc = await srvGeneratePresentationLetter(user, { startDate }, adminId, reqInfo);

        res.status(201).json({
            msg: "Carta de presentación generada exitosamente",
            url: generatedDoc.fileUrl,
            document: generatedDoc
        });

    } catch (error) {
        console.error("❌ Error generando carta de presentación:", error);
        if (error.message.includes("no tiene un Cliente asignado")) {
            return res.status(400).json({ msg: "El usuario operativo no tiene un cliente asignado actualmente." });
        }
        res.status(500).json({ msg: "Error interno generando el documento", error: error.message });
    }
};

export {
    generateContractPDF,
    generateLaborCertificatePDF,
    generateCarnetPDF,
    generatePresentationLetterPDF
};