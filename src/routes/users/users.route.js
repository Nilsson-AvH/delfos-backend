import express from "express";
import multer from 'multer'; // <--- CAMBIO 1: Multer nativo
import { 
    createUser, 
    deleteUserById, 
    getAllUsers, 
    getUserById, 
    updateUserById,
    updateUserProfilePhoto 
} from "../../controllers/user.controller.js";
// Controlador HISTÓRICO (La nueva organización)
import {
    transferOperationalUser,
    renewContract,
    updateSocialSecurity
} from "../../controllers/OperationalHistory.controller.js"; // <--- ¡AQUÍ ESTÁ!
import authenticationUser from "../../middlewares/authentication.middleware.js";
import authorizationUser from "../../middlewares/authorization.middleware.js";
// import { uploadImage } from "../../middlewares/multer.middleware.js";
// import { updateUserPhoto } from "../../controllers/userOperational.controller.js";


const router = express.Router();
const upload = multer();

// 1. RUTAS ESPECÍFICAS (Operational History) - ¡Ponlas primero!
// Así Express revisa estas rutas largas antes de intentar encajarlas en un ID genérico.
router.put('/photo', [authenticationUser, authorizationUser, upload.single("photo")], updateUserProfilePhoto);
router.patch('/operational/:id/transfer', [authenticationUser, authorizationUser], transferOperationalUser);
router.patch('/operational/:id/renew-contract', [authenticationUser, authorizationUser], renewContract);
router.patch('/operational/:id/update-ss', [authenticationUser, authorizationUser], updateSocialSecurity);

// 2. RUTAS GENÉRICAS (CRUD Básico de Usuario)
//TODO: <> COMENTAR ROUTER.POST SIN MIDDLEWARES Y DESCOMENTAR ROUTER.GET CON MIDDLEWARES CUANDO ARREGLE EL FRONTEND CON MIDDLEWARES
// router.post(`/`, createUser);
router.post(`/`, [authenticationUser, authorizationUser], createUser);
//TODO: </> COMENTAR ROUTER.POST SIN MIDDLEWARES Y DESCOMENTAR ROUTER.GET CON MIDDLEWARES CUANDO ARREGLE EL FRONTEND CON MIDDLEWARES

//TODO: <> COMENTAR ROUTER.GET SIN MIDDLEWARES Y DESCOMENTAR ROUTER.GET CON MIDDLEWARES CUANDO ARREGLE EL FRONTEND CON MIDDLEWARES
// router.get(`/`, getAllUsers);
router.get(`/`, [authenticationUser, authorizationUser], getAllUsers);
//TODO: </> COMENTAR ROUTER.GET SIN MIDDLEWARES Y DESCOMENTAR ROUTER.GET CON MIDDLEWARES CUANDO ARREGLE EL FRONTEND CON MIDDLEWARES
router.get(`/:idUser`, [authenticationUser, authorizationUser], getUserById);       // :idUser captura cualquier cosa
router.patch(`/:idUser`, [authenticationUser, authorizationUser], updateUserById);
router.delete(`/:idUser`, [authenticationUser, authorizationUser], deleteUserById);

export default router;