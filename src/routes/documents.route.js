import { Router } from "express";
import { createDocument, deleteDocumentById, getAllDocuments, getDocumentById, updateDocumentById } from "../controllers/document.controller.js";

const router = Router();

// Define las rutas para /api/v1/documents
router.get(`/`, getAllDocuments);
router.post(`/`, createDocument);
router.get(`/:id`, getDocumentById);
router.patch(`/:id`, updateDocumentById);
router.delete(`/:id`, deleteDocumentById);


export default router;
