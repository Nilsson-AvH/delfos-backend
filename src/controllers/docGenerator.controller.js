import { 
    srvGenerateContract, 
    srvGenerateCertificate, 
    srvGenerateCarnet, 
    srvGeneratePresentationLetter } from '../services/docGenerator.service.js';
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

// =====================================================================
// POST: Generar Carnet PDF
// =====================================================================
const generateCarnetPDF = async (req, res) => {
    try {
        const { userId } = req.body; // Solo necesitamos el ID del usuario

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

        const adminId = req.userId; // Quien hace la petición

        const generatedDoc = await srvGenerateCarnet(user, adminId);

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
        // Recibimos userId y la fecha manual de inicio
        const { userId, startDate } = req.body; 

        // Validaciones básicas de entrada
        if (!userId) {
            return res.status(400).json({ msg: "El userId es obligatorio." });
        }
        if (!startDate) {
            return res.status(400).json({ msg: "La fecha de inicio (startDate) es obligatoria (Formato: DD/MM/YYYY)." });
        }

        // Buscar usuario base
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: "Usuario no encontrado en la base de datos." });
        }

        const adminId = req.userId; // ID del administrador que genera el documento (viene del token)

        // Llamar al servicio con los datos manuales empaquetados
        const generatedDoc = await srvGeneratePresentationLetter(user, { startDate }, adminId);

        // Respuesta exitosa
        res.status(201).json({
            msg: "Carta de presentación generada exitosamente",
            url: generatedDoc.fileUrl,
            document: generatedDoc
        });

    } catch (error) {
        console.error("❌ Error generando carta de presentación:", error);
        
        // Manejo de errores específicos del negocio
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
}
