import express from "express";
import { createUser, deleteUserById, getAllUsers, getUserById, updateUserById } from "../../controllers/user.controller.js";
// Controlador HISTÓRICO (La nueva organización)
import {
    transferOperationalUser,
    renewContract,
    updateSocialSecurity
} from "../../controllers/OperationalHistory.controller.js"; // <--- ¡AQUÍ ESTÁ!
import authenticationUser from "../../middlewares/authentication.middleware.js";
import authorizationUser from "../../middlewares/authorization.middleware.js";

const router = express.Router();

// 1. RUTAS ESPECÍFICAS (Operational History) - ¡Ponlas primero!
// Así Express revisa estas rutas largas antes de intentar encajarlas en un ID genérico.
router.patch('/operational/:id/transfer', [authenticationUser, authorizationUser], transferOperationalUser);
router.patch('/operational/:id/renew-contract', [authenticationUser, authorizationUser], renewContract);
router.patch('/operational/:id/update-ss', [authenticationUser, authorizationUser], updateSocialSecurity);

// 2. RUTAS GENÉRICAS (CRUD Básico de Usuario)
router.post(`/`, [authenticationUser, authorizationUser], createUser);
router.get(`/`, [authenticationUser, authorizationUser], getAllUsers);
router.get(`/:idUser`, [authenticationUser, authorizationUser], getUserById);       // :idUser captura cualquier cosa
router.patch(`/:idUser`, [authenticationUser, authorizationUser], updateUserById);
router.delete(`/:idUser`, [authenticationUser, authorizationUser], deleteUserById);

export default router;