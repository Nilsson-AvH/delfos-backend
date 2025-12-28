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

// 1. IMPORTAR CLOUDINARY AQUÍ ARRIBA ☁️
import { v2 as cloudinary } from 'cloudinary';

// =====================================================================
// CREATE (ADAPTADO AL MODELO DELFOS)
// =====================================================================
const createDocument = async (req, res) => {
    try {
        //console.log("--> 1. Entrando a createDocument");
        //console.log("--> REQ.BODY (Lo que llega del body):", req.body); // <--- ESTO ES LO QUE NECESITO VER
        //console.log("--> REQ.FILE (Lo que llega de Cloudinary):", req.file); // <--- ESTO ES LO QUE NECESITO VER
        // 1. Extraer datos del Body (Texto) y del File (Cloudinary)
        // Nota: 'documentType' debe coincidir con tu ENUM (ej: 'Cedula', 'CursoVigilancia')

        // req.body trae: userId, documentType, title, expiryDate, verificationCode, issuingEntity (texto)
        const {
            userId,
            documentType,
            title,
            expiryDate,
            verificationCode,
            issuingEntity
        } = req.body;

        // req.file trae: path (URL de Cloudinary), originalname, mimetype (archivo)
        const file = req.file;

        // Buscamos el ID en cualquiera de las dos propiedades posibles
        const cloudId = file.filename || file.public_id;

        // 2. Validaciones Previas
        if (!userId) {
            return res.status(400).json({ msg: "Falta el ID del usuario (userId)." });
        }
        if (!documentType) {
            return res.status(400).json({ msg: "El tipo de documento es obligatorio." });
        }
        if (!file) {
            return res.status(400).json({ msg: "No has subido ningún archivo (key: 'file')." });
        }

        // 3. Verificar existencia del usuario base
        const userExists = await dbGetUserById(userId);
        if (!userExists) {
            return res.status(404).json({ msg: "El usuario no existe." });
        }

        // 4. PREPARAR OBJETO PARA MONGOOSE
        // Mapeamos lo que devuelve Cloudinary a tus nombres de campo
        const docData = {
            user: userId,
            documentType: documentType,
            title: title || file.originalname, // Si no manda título, usamos el nombre del archivo

            // --- DATOS DE CLOUDINARY ---
            fileUrl: file.path || file.secure_url,        // Tu modelo pide 'fileUrl'
            publicId: cloudId,   // Importante para borrarlo después de la nube
            mimeType: file.mimetype,   // Ej: image/jpeg, application/pdf
            size: file.size,           // Peso en bytes

            // --- CAMPOS OPCIONALES (Para validaciones) Curso de Vigilancia---
            expiryDate: expiryDate || null,
            verificationCode: verificationCode || null,
            issuingEntity: issuingEntity || null,
            status: 'Pendiente' // Por defecto entra a revisión
        };

        // 5. GUARDAR EN BD (Aquí se activan tus validaciones pre-save)
        const documentRegistered = await dbRegisterDocument(docData);

        // 6. VINCULAR AL PERFIL OPERATIVO
        // Solo si es un operativo, guardamos la referencia en su perfil
        if (userExists.role === 'operational') {
            await OperationalUser.findOneAndUpdate(
                { user: userId },
                { $push: { documents: documentRegistered._id } }
            );
        }

        res.status(201).json({
            msg: "Documento subido, analizado y registrado exitosamente.",
            document: documentRegistered
        });

    } catch (error) {
        console.error(error);

        // Manejo de tus errores de validación (ej: "Falta expiryDate en Curso")
        if (error.message.includes("requiere fecha de vencimiento") ||
            error.message.includes("requiere el código")) {
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
// DELETE (BORRADO TOTAL: NUBE + BD + REFERENCIA USUARIO) 🗑️
// =====================================================================
const deleteDocumentById = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. BUSCAR EL DOCUMENTO PREVIAMENTE
        // Necesitamos saber:
        // a) Su publicId (para borrarlo de Cloudinary)
        // b) Su user (el dueño, para desvincularlo del perfil)
        const docFound = await dbGetDocumentById(id);

        if (!docFound) {
            return res.status(404).json({ msg: "Documento no encontrado para eliminar" });
        }

        // 2. BORRAR DE CLOUDINARY ☁️
        // Si tiene un publicId guardado, le decimos a Cloudinary que lo destruya
        if (docFound.publicId) {
            console.log(`🔥 Intentando borrar de Cloudinary: ${docFound.publicId}`); // <--- AGREGA ESTO
            try {
                const result = await cloudinary.uploader.destroy(docFound.publicId);
                console.log("✅ Resultado Cloudinary:", result); // <--- Y ESTO
            } catch (cloudError) {
                console.error("Error borrando de Cloudinary:", cloudError);
            }
        } else {
            console.log("⚠️ El documento NO tenía publicId guardado. Se saltó el borrado en Nube.");
        }

        // 3. AHORA SÍ, BORRAR DE MONGODB 🗄️
        const documentDeleted = await dbDeleteDocumentById(id);

        // 4. DESVINCULAR DEL USUARIO OPERATIVO (LIMPIEZA) 🧹
        // Usamos $pull para "arrancar" el ID de ese documento del array del usuario.
        if (docFound.user) {
            await OperationalUser.findOneAndUpdate(
                { user: docFound.user }, // Buscamos al dueño del documento
                { $pull: { documents: docFound._id } } // Sacamos ESTE documento de su lista
            );
        }

        res.json({
            msg: "Documento eliminado correctamente (Nube, Base de Datos y Perfil Usuario)",
            data: documentDeleted
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