import express from 'express';
import {
    getAllCompanyDocuments,
    getDocumentsByOperationalId,
    deleteCompanyDocument
} from '../controllers/companyDocuments.controller.js';
import authenticationUser from '../middlewares/authentication.middleware.js';
import authorizationUser from '../middlewares/authorization.middleware.js';

const router = express.Router();

// Base: /api/v1/company-documents

// 1. Listar todo el archivo muerto (Solo Admin)
router.get('/', [authenticationUser, authorizationUser], getAllCompanyDocuments);

// 2. Ver carpeta de documentos de un empleado (Por ID de Operativo)
router.get('/operational/:id', [authenticationUser, authorizationUser], getDocumentsByOperationalId);

// 3. Eliminar documento y PDF
router.delete('/:id', [authenticationUser, authorizationUser], deleteCompanyDocument);

export default router;