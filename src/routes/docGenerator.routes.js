import express from 'express';
import {
    generateContractPDF,
    generateLaborCertificatePDF
}
    from '../controllers/docGenerator.controller.js';
import authenticationUser from '../middlewares/authentication.middleware.js';
import authorizationUser from '../middlewares/authorization.middleware.js';

const router = express.Router();

// POST /api/v1/generator/contract
// Solo Admins y Root pueden generar contratos legales
router.post('/contract', [authenticationUser, authorizationUser], generateContractPDF);
router.post('/certificate', [authenticationUser, authorizationUser], generateLaborCertificatePDF);

export default router;