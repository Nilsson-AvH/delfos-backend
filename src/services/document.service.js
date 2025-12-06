import DocumentModel from "../models/Documents.model.js";

const dbRegisterDocument = async (newDocument) => {
    return await DocumentModel.create(newDocument);
}

const dbGetAllDocuments = async () => {
    // Version corta (No es muy legible)
    // return await DocumentModel.find({}).populate('user', '-password -email').select('-__v');

    // Version larga (Es muy legible)
    return await DocumentModel.find({})
        .populate({
            path: 'user',
            select: '-password -email -createdAt -updatedAt -role -status'
        })
        .select('-__v');
}

export {
    dbRegisterDocument,
    dbGetAllDocuments
}
