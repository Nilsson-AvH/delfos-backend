import express from 'express';
import authenticationUser from '../../middlewares/authentication.middleware.js';
import authorizationUser from '../../middlewares/authorization.middleware.js'; // Asumo que este valida roles

import { 
    getCompanyConfig, 
    createCompanyConfig, 
    updateCompanyConfig 
} from '../../controllers/system/systemCompany.controller.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticationUser);

// GET: Puede ser abierto a 'admin' y 'superadmin' para ver los datos en el dashboard
router.get('/', getCompanyConfig);

// POST y PUT: Solo 'root' (tú) o 'superadmin' (el dueño de la empresa)
// Ajusta 'authorizationUser' para que acepte parámetros de roles si tu middleware lo soporta, 
// o crea una validación extra aquí.
router.post('/', authorizationUser, createCompanyConfig); 
router.put('/', authorizationUser, updateCompanyConfig);

export default router;