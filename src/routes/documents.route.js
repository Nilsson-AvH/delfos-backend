import { Router } from "express";
import {
    createDocument,
    deleteDocumentById,
    getAllDocuments,
    getDocumentById,
    updateDocumentById,
    getDocumentsByUser // <--- 1. IMPORTANTE: Importamos la nueva función
} from "../controllers/document.controller.js";

const router = Router();

// Rutas base: /api/v1/documents

// Crear Documento
router.post(`/`, createDocument); //http://localhost:3000/api/v1/documents

// Listar Documentos
router.get(`/`, getAllDocuments); //http://localhost:3000/api/v1/documents

// 2. RUTA IMPORTANTE: Obtener carpeta de un empleado especifico
// OJO: Esta ruta debe ir ANTES de `/:id` para que Express no confunda "user" con un ID.
router.get(`/user/:userId`, getDocumentsByUser); //http://localhost:3000/api/v1/documents/user/:userId

// Operaciones por ID de Documento
// NOTA: Cambié ':idDocument' por ':id' para que coincida con el controlador (req.params.id)
// Obtener documentos por ID
router.get(`/:id`, getDocumentById); //http://localhost:3000/api/v1/documents/:id

// Actualizar documentos por ID
router.patch(`/:id`, updateDocumentById); //http://localhost:3000/api/v1/documents/:id

// Eliminar documentos por ID
router.delete(`/:id`, deleteDocumentById); //http://localhost:3000/api/v1/documents/:id

export default router;