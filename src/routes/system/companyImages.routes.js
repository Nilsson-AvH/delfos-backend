import { Router } from 'express';
import multer from 'multer'; 
import authenticationUser from '../../middlewares/authentication.middleware.js';
import authorizationUser from '../../middlewares/authorization.middleware.js';
import { updateCompanyImages } from '../../controllers/system/companyImages.controller.js';

const router = Router();
const upload = multer(); // Almacenamiento RAM

router.use(authenticationUser, authorizationUser);

// =====================================================================
// RUTAS DE IMAGEN CORPORATIVA
// =====================================================================

// PUT /api/v1/company-images/update
// Recibe un FormData con cualquiera de las keys (logoUrl, watermarkUrl, etc.)
// Usamos los mismos nombres del modelo para facilitar las cosas.
router.put('/update', upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'logoHeader', maxCount: 1 },
    { name: 'logoFooter', maxCount: 1 },
    { name: 'watermark', maxCount: 1 },
    { name: 'employeeFrontCard', maxCount: 1 },
    { name: 'employeeBackCard', maxCount: 1 },
    { name: 'qrCode', maxCount: 1 },
    { name: 'letterHead', maxCount: 1 },
    { name: 'signature', maxCount: 1 }
]), updateCompanyImages);

export default router;