import CompanyDocument from '../models/CompanyDocument.model.js';
import OperationalUser from '../models/users/UserOperational.model.js';
import User from '../models/users/User.model.js';
// 👇 IMPORTANTE: Importamos tu nuevo servicio maestro
import { srvDeleteCompanyFile } from '../services/storage/storage.service.js';

// =====================================================================
// GET: Ver TODOS los documentos generados (Historial global)
// =====================================================================
export const getAllCompanyDocuments = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';

        let query = {};

        if (search) {
            const searchRegex = new RegExp(search, 'i');

            // 1. Buscar usuarios que coincidan con el término
            const matchingUsers = await User.find({
                $or: [
                    { names: searchRegex },
                    { lastName: searchRegex },
                    { nuip: searchRegex }
                ]
            }).select('_id');

            const userIds = matchingUsers.map(u => u._id);

            // 2. Filtrar documentos donde el documentType coincida O el user esté en userIds
            query = {
                $or: [
                    { documentType: searchRegex },
                    { user: { $in: userIds } }
                ]
            };
        }

        const skip = (page - 1) * limit;

        const total = await CompanyDocument.countDocuments(query);
        const docs = await CompanyDocument.find(query)
            .populate('user', 'names lastName nuip')
            .populate('generatedBy', 'names')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            docs,
            total,
            page,
            totalPages: Math.ceil(total / limit) || 1
        });
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
        const { id } = req.params;

        const opUser = await OperationalUser.findById(id);
        if (!opUser) {
            return res.status(404).json({ msg: "Usuario Operativo no encontrado" });
        }

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
// DELETE: Borrar Documento (Inteligente: Local / Cloudinary / S3)
// =====================================================================
export const deleteCompanyDocument = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Buscamos el documento primero
        const docToDelete = await CompanyDocument.findById(id);
        if (!docToDelete) {
            return res.status(404).json({ msg: "Documento no encontrado" });
        }

        // 2. DETECTAR CARPETA CORRECTA 📂
        // Para borrar en Local, necesitamos saber en qué carpeta está.
        // Esta lógica debe coincidir con la que usaste al crear (en docGenerator).
        let folderName = 'delfos-official-docs'; // Por defecto (Contratos, Certificados, Cartas)

        if (docToDelete.documentType === 'CarnetCorporativo') {
            folderName = 'delfos-carnets';
        }

        // 3. EJECUTAR BORRADO FÍSICO (Usando el Servicio Maestro)
        // Pasamos: ID, Proveedor (local/s3/cloudinary) y la Carpeta
        await srvDeleteCompanyFile(
            docToDelete.publicId,
            docToDelete.storageProvider, // <--- Esto le dice al helper qué estrategia usar
            folderName
        );

        // 4. BORRAR DE MONGODB
        await CompanyDocument.findByIdAndDelete(id);

        res.json({
            msg: "Documento eliminado correctamente (Físico y BD).",
            deletedId: docToDelete._id,
            provider: docToDelete.storageProvider
        });

    } catch (error) {
        console.error("❌ Error borrando documento:", error);
        res.status(500).json({ msg: "Error al eliminar el documento", error: error.message });
    }
};