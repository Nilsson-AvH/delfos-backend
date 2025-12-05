const createDocument = (req, res) => {
    res.json({ msg: "Document created" });
}

const getAllDocuments = (req, res) => {
    res.json({ msg: "All documents" });
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
