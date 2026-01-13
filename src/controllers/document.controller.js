import {
    dbGetAllDocuments,
    dbRegisterDocument,
    dbGetDocumentById,
    dbUpdateDocumentById,
    dbDeleteDocumentById,
    dbGetDocumentsByUserId
} from "../services/document.service.js";
import { dbGetUserById } from "../services/user.service.js";
import OperationalUser from "../models/users/UserOperational.model.js";

// 👇 IMPORTAMOS NUESTROS SERVICIOS MAESTROS DE STORAGE 👇
import { srvSaveCompanyFile, srvDeleteCompanyFile } from "../services/storage/storage.service.js";

// =====================================================================
// CREATE (MIGRADO A STORAGE HÍBRIDO) 🚀
// =====================================================================
const createDocument = async (req, res) => {
    try {
        const {
            userId, documentType, title, expiryDate, verificationCode, issuingEntity
        } = req.body;

        // Validaciones Básicas
        if (!userId) return res.status(400).json({ msg: "Falta el ID del usuario (userId)." });
        if (!documentType) return res.status(400).json({ msg: "El tipo de documento es obligatorio." });
        if (!req.file) return res.status(400).json({ msg: "No has subido ningún archivo." });

        // Verificar usuario
        const userExists = await dbGetUserById(userId);
        if (!userExists) return res.status(404).json({ msg: "El usuario no existe." });

        // 1. DETERMINAR EXTENSIÓN
        const extension = req.file.mimetype.split('/')[1] || 'pdf'; // Ej: 'jpeg', 'pdf'

        // 2. GUARDAR ARCHIVO (Usando el Servicio Maestro)
        // Usamos una carpeta separada 'delfos-user-docs' para no mezclarlos con los contratos
        const storageResult = await srvSaveCompanyFile(
            req.file.buffer, 
            'delfos-user-docs', // Nombre de la carpeta
            extension
        );

        // 3. PREPARAR DATA PARA MONGO
        const docData = {
            user: userId,
            documentType: documentType,
            title: title || req.file.originalname,

            // --- DATOS DEL STORAGE HÍBRIDO ---
            fileUrl: storageResult.url,
            publicId: storageResult.publicId,
            storageProvider: storageResult.provider, // <--- 'local', 's3' o 'cloudinary'
            
            mimeType: req.file.mimetype,
            size: req.file.size,

            // --- CAMPOS DE NEGOCIO ---
            expiryDate: expiryDate || null,
            verificationCode: verificationCode || null,
            issuingEntity: issuingEntity || null,
            status: 'Pendiente'
        };

        const documentRegistered = await dbRegisterDocument(docData);

        // 4. VINCULAR AL PERFIL OPERATIVO
        if (userExists.role === 'operational') {
            await OperationalUser.findOneAndUpdate(
                { user: userId },
                { $push: { documents: documentRegistered._id } }
            );
        }

        res.status(201).json({
            msg: "Documento registrado exitosamente.",
            document: documentRegistered
        });

    } catch (error) {
        console.error(error);
        if (error.message.includes("requiere fecha") || error.message.includes("código")) {
            return res.status(400).json({ msg: "Error de Validación", error: error.message });
        }
        res.status(500).json({ msg: "Error al procesar el documento", error: error.message });
    }
};

// =====================================================================
// READ
// =====================================================================
const getAllDocuments = async (req, res) => {
    try {
        const documents = await dbGetAllDocuments();
        res.json({ documents });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al obtener documentos" });
    }
};

const getDocumentById = async (req, res) => {
    try {
        const { id } = req.params;
        const document = await dbGetDocumentById(id);

        if (!document) {
            return res.status(404).json({ msg: "Documento no encontrado" });
        }
        res.json({ document });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al buscar el documento" });
    }
};

// Nuevo Endpoint: Obtener carpeta de un empleado
const getDocumentsByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const documents = await dbGetDocumentsByUserId(userId);
        res.json({ userId, documents });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al buscar documentos del usuario" });
    }
};

// =====================================================================
// UPDATE
// =====================================================================
const updateDocumentById = async (req, res) => {
    try {
        const { id } = req.params;
        const dataToUpdate = req.body;

        const documentUpdated = await dbUpdateDocumentById(id, dataToUpdate);

        if (!documentUpdated) {
            return res.status(404).json({ msg: "Documento no encontrado para actualizar" });
        }

        res.json({ msg: "Documento actualizado", data: documentUpdated });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al actualizar documento" });
    }
};

// =====================================================================
// DELETE (MIGRADO A STORAGE HÍBRIDO) 🗑️
// =====================================================================
const deleteDocumentById = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Buscar documento
        const docFound = await dbGetDocumentById(id);
        if (!docFound) return res.status(404).json({ msg: "Documento no encontrado" });

        // 2. BORRAR ARCHIVO FÍSICO (Usando el Servicio Maestro)
        // Pasamos: ID, Proveedor y la Carpeta donde lo guardamos al crear
        await srvDeleteCompanyFile(
            docFound.publicId, 
            docFound.storageProvider, 
            'delfos-user-docs' // <--- OJO: Debe ser la misma carpeta del create
        );

        // 3. BORRAR DE BD
        const documentDeleted = await dbDeleteDocumentById(id);

        // 4. DESVINCULAR DE USUARIO
        if (docFound.user) {
            await OperationalUser.findOneAndUpdate(
                { user: docFound.user },
                { $pull: { documents: docFound._id } }
            );
        }

        res.json({
            msg: "Documento eliminado correctamente (Físico y BD)",
            deletedId: id
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al eliminar documento" });
    }
};

export {
    createDocument,
    getAllDocuments,
    getDocumentById,
    getDocumentsByUser, // <--- No olvides exportar este nuevo y agregarlo a tus rutas
    updateDocumentById,
    deleteDocumentById
}