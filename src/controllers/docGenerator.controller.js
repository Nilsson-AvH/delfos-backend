import { srvGenerateContract, srvGenerateCertificate } from '../services/docGenerator.service.js';
import Contract from '../models/Contract.model.js';
import User from '../models/users/User.model.js';

// =====================================================================
// POST: Generar Contrato PDF
// =====================================================================
const generateContractPDF = async (req, res) => {
    try {
        // Recibimos IDs. El contrato ya debe existir en BD (creado previamente)
        const { userId, contractId } = req.body;

        // 1. Buscar la Info Real (Data)
        const user = await User.findById(userId);
        const contract = await Contract.findById(contractId);

        if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });
        if (!contract) return res.status(404).json({ msg: "Contrato no encontrado (Crea primero el registro de datos)" });

        // 2. Llamar al Motor Generador
        // Usamos req.userId que es lo que guarda tu authentication.middleware.js
        const adminId = req.userId;

        const generatedDoc = await srvGenerateContract(user, contract, adminId);

        // 3. Actualizar el modelo Contract con el link del PDF
        // Así cerramos el círculo: El contrato de Data apunta al contrato de Papel.
        contract.attachedDocument = generatedDoc._id;
        await contract.save();

        res.status(201).json({
            msg: "Contrato generado exitosamente",
            url: generatedDoc.fileUrl, // Devolvemos el link directo para que lo veas
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
        const { userId } = req.body; // Solo necesitamos el ID del usuario

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

        // Usamos req.userId (del middleware) como el generador
        const adminId = req.userId;

        const generatedDoc = await srvGenerateCertificate(user, adminId);

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

export {
    generateContractPDF,
    generateLaborCertificatePDF
}
