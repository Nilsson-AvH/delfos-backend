import {
    dbGetAllDocuments,
    dbRegisterDocument,
    dbGetDocumentById,
    dbUpdateDocumentById,
    dbDeleteDocumentById,
    dbGetDocumentsByUserId
} from "../services/document.service.js";

// Necesitamos validar que el usuario exista antes de asignarle un documento
import { dbGetUserById } from "../services/user.service.js";
import OperationalUser from "../models/users/UserOperational.model.js";

// =====================================================================
// CREATE
// =====================================================================
const createDocument = async (req, res) => {
    try {
        const inputData = req.body;

        // 1. Validar que llegue el usuario
        if (!inputData.user) {
            return res.status(400).json({ msg: "Falta el ID del usuario." });
        }

        // 2. Verificar existencia del usuario base
        const userExists = await dbGetUserById(inputData.user);
        if (!userExists) {
            return res.status(404).json({ msg: "El usuario no existe." });
        }

        // 3. CREAR EL DOCUMENTO
        const documentRegistered = await dbRegisterDocument(inputData);

        // 4. [PASO NUEVO] VINCULAR AL PERFIL OPERATIVO
        // Buscamos el perfil operativo asociado a ese usuario y le empujamos el ID del documento
        await OperationalUser.findOneAndUpdate(
            { user: inputData.user },
            { $push: { documents: documentRegistered._id } }
        );

        res.status(201).json({
            msg: "Documento creado y vinculado exitosamente",
            documentRegistered
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al crear el documento", error: error.message });
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
// DELETE
// =====================================================================
const deleteDocumentById = async (req, res) => {
    try {
        const { id } = req.params;

        // Aquí podrías agregar lógica para borrar el archivo de Cloudinary usando publicId
        // const doc = await dbGetDocumentById(id);
        // if(doc.publicId) await deleteFromCloudinary(doc.publicId);

        const documentDeleted = await dbDeleteDocumentById(id);

        if (!documentDeleted) {
            return res.status(404).json({ msg: "Documento no encontrado para eliminar" });
        }
        res.json({ msg: "Documento eliminado", data: documentDeleted });
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