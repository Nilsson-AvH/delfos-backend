import { dbGetAllDocuments, dbRegisterDocument } from "../services/document.service.js";

const createDocument = async (req, res) => {
    try {
        const inputData = req.body;

        const documentRegistered = await dbRegisterDocument(inputData);

        res.json({ documentRegistered });
    }
    catch (error) {
        console.error(error);
        res.json({
            msg: `Error al crear el documento`
        });
    }
}

const getAllDocuments = async (req, res) => {
    try {
        const documents = await dbGetAllDocuments();

        res.json({ documents });
    }
    catch (error) {
        console.error(error);
        res.json({
            msg: `Error al obtener los documentos`
        });
    }
}

const getDocumentById = (req, res) => {
    res.json({ msg: "Document by id" });
}

const updateDocumentById = (req, res) => {
    res.json({ msg: "Document updated by id" });
}

const deleteDocumentById = (req, res) => {
    res.json({ msg: "Document deleted by id" });
}

export {
    createDocument,
    getAllDocuments,
    getDocumentById,
    updateDocumentById,
    deleteDocumentById
}
