import express from 'express';
import authenticationUser from '../../middlewares/authentication.middleware.js';
import authorizationUser from '../../middlewares/authorization.middleware.js'; 

import { 
    createBranch, 
    getAllBranches 
} from '../../controllers/system/systemBranch.controller.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticationUser);

// Listar sedes (Permitido a admins)
router.get('/', getAllBranches);

// Crear sede (Solo Root o Superadmin) -> Aquí se dispara la validación de pago
router.post('/', authorizationUser, createBranch); 

export default router;