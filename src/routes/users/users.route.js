import express from "express";
import { createUser, deleteUserById, getAllUsers, getUserById, updateUserById } from "../../controllers/user.controller.js";
// Controlador HISTÓRICO (La nueva organización)
import {
    transferOperationalUser,
    renewContract,
    updateSocialSecurity
} from "../../controllers/OperationalHistory.controller.js"; // <--- ¡AQUÍ ESTÁ!

const router = express.Router();

// 1. RUTAS ESPECÍFICAS (Operational History) - ¡Ponlas primero!
// Así Express revisa estas rutas largas antes de intentar encajarlas en un ID genérico.
router.patch('/operational/:id/transfer', transferOperationalUser);
router.patch('/operational/:id/renew-contract', renewContract);
router.patch('/operational/:id/update-ss', updateSocialSecurity);

// 2. RUTAS GENÉRICAS (CRUD Básico de Usuario)
router.post(`/`, createUser);
router.get(`/`, getAllUsers);
router.get(`/:idUser`, getUserById);       // :idUser captura cualquier cosa
router.patch(`/:idUser`, updateUserById);
router.delete(`/:idUser`, deleteUserById);

export default router;