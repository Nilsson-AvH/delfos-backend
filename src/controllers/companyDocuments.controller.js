import CompanyDocument from '../models/CompanyDocument.model.js';
import OperationalUser from '../models/users/UserOperational.model.js';
import { v2 as cloudinary } from 'cloudinary';

// =====================================================================
// GET: Ver TODOS los documentos generados (Historial global)
// =====================================================================
export const getAllCompanyDocuments = async (req, res) => {
    try {
        const docs = await CompanyDocument.find()
            .populate('user', 'names lastName nuip') // Traemos nombre del empleado
            .populate('generatedBy', 'names')        // Traemos quién lo generó
            .sort({ createdAt: -1 });

        res.json(docs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al obtener documentos" });
    }
};

// =====================================================================
// GET: Documentos por ID de OPERATIVO
// =====================================================================
export const getDocumentsByOperationalId = async (req, res) => {
    try {
        const { id } = req.params; // Recibimos ID del OperationalUser

        // 1. Primero buscamos al Operativo para saber cuál es su 'User' base
        // Recuerda: CompanyDocument se guarda con el ID del Usuario Base (Authentication)
        const opUser = await OperationalUser.findById(id);

        if (!opUser) {
            return res.status(404).json({ msg: "Usuario Operativo no encontrado" });
        }

        // 2. Buscamos los documentos que pertenezcan a ese Usuario Base
        const docs = await CompanyDocument.find({ user: opUser.user })
            .sort({ createdAt: -1 });

        res.json({
            operationalId: opUser._id,
            userBaseId: opUser.user,
            documents: docs
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error buscando documentos del operario" });
    }
};

// =====================================================================
// DELETE: Borrar Documento (BD + Cloudinary)
// =====================================================================
export const deleteCompanyDocument = async (req, res) => {
    try {
        const { id } = req.params; // ID del CompanyDocument

        // 1. Buscamos el documento primero (necesitamos el publicId)
        const docToDelete = await CompanyDocument.findById(id);

        if (!docToDelete) {
            return res.status(404).json({ msg: "Documento no encontrado" });
        }

        // 2. Borrar de CLOUDINARY
        // Usamos el publicId que guardamos cuando lo creamos
        if (docToDelete.publicId) {
            await cloudinary.uploader.destroy(docToDelete.publicId, {
                resource_type: 'raw' // IMPORTANTE: Como es PDF, suele ser 'raw' o 'image' según cómo se subió. 
                // En el generador usamos 'raw'.
            });
        }

        // 3. Borrar de MONGODB
        await CompanyDocument.findByIdAndDelete(id);

        res.json({
            msg: "Documento eliminado de la base de datos y de la nube correctamente.",
            deletedId: docToDelete._id
        });

    } catch (error) {
        console.error("❌ Error borrando documento:", error);
        res.status(500).json({ msg: "Error al eliminar el documento", error: error.message });
    }
};