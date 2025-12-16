import { Router } from "express";
import { createDocument, deleteDocumentById, getAllDocuments, getDocumentById, updateDocumentById } from "../controllers/document.controller.js";

const router = Router();

// Define las rutas para /api/v1/documents
router.post(`/`, createDocument);
router.get(`/`, getAllDocuments);
router.get(`/:idDocument`, getDocumentById);
router.patch(`/:idDocument`, updateDocumentById);
router.delete(`/:idDocument`, deleteDocumentById);

export default router;
