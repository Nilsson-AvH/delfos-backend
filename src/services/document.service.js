import DocumentModel from "../models/Documents.model.js";

// =====================================================================
// 1. CREATE
// =====================================================================
const dbRegisterDocument = async (newDocument) => {
    return await DocumentModel.create(newDocument);
};

// =====================================================================
// 2. READ (Queries)
// =====================================================================

const dbGetAllDocuments = async () => {
    return await DocumentModel.find({})
        .populate({
            path: 'user',
            select: 'names lastName email role nuip' // Traemos datos útiles del dueño
        })
        .select('-__v'); // Ocultamos versión de Mongoose
};

const dbGetDocumentById = async (id) => {
    return await DocumentModel.findById(id)
        .populate('user', 'names lastName nuip');
};

/**
 * Busca todos los documentos de un usuario específico.
 * Útil para: "Ver carpeta del empleado X"
 */
const dbGetDocumentsByUserId = async (userId) => {
    return await DocumentModel.find({ user: userId })
        .populate('user', 'names lastName nuip');
};

// =====================================================================
// 3. UPDATE
// =====================================================================
const dbUpdateDocumentById = async (id, data) => {
    return await DocumentModel.findByIdAndUpdate(
        id,
        data,
        { new: true, runValidators: true } // runValidators es CLAVE para que revise tus reglas (expiryDate, etc.)
    );
};

// =====================================================================
// 4. DELETE
// =====================================================================
const dbDeleteDocumentById = async (id) => {
    return await DocumentModel.findByIdAndDelete(id);
};

export {
    dbRegisterDocument,
    dbGetAllDocuments,
    dbGetDocumentById,
    dbGetDocumentsByUserId,
    dbUpdateDocumentById,
    dbDeleteDocumentById
}