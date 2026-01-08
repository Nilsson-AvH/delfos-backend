import express from 'express';
import {
    generateContractPDF,
    generateLaborCertificatePDF,
    generateCarnetPDF,
    generatePresentationLetterPDF
}
    from '../controllers/docGenerator.controller.js';
import authenticationUser from '../middlewares/authentication.middleware.js';
import authorizationUser from '../middlewares/authorization.middleware.js';

const router = express.Router();

// POST /api/v1/generator/contract
// Solo Admins y Root pueden generar contratos legales
router.post('/contract', [authenticationUser, authorizationUser], generateContractPDF);
router.post('/certificate', [authenticationUser, authorizationUser], generateLaborCertificatePDF);
router.post('/carnet', [authenticationUser, authorizationUser], generateCarnetPDF);
router.post('/presentation-letter', [authenticationUser, authorizationUser], generatePresentationLetterPDF);

export default router;