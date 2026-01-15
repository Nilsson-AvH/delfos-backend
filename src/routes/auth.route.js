import { Router } from "express";
import multer from "multer";
import { register, loginUser, renewToken, updateSignature, removeSignature } from "../controllers/auth.controller.js";
import authenticationUser from "../middlewares/authentication.middleware.js";
import authorizationUser from "../middlewares/authorization.middleware.js";

const router = Router();
const upload = multer();

// Definir las rutas para la autenticacion
router.post('/login', loginUser);     //Inicia sesion, requiere autenticacion

//Registra un nuevo usuario, requiere autenticacion del superadmin
//Agregamos middleware multer para subir la firma
router.post(`/register`, upload.single('signature'), register);     

//Renueva el token y si el token es valido, no necesita autenticacion
router.get(
    '/renew-token',
    [authenticationUser, authorizationUser], // Requiere autenticacion y autorizacion
    renewToken
);  

// PUT: Actualizar firma (Sobrescribe la anterior)
// Requiere: Token + Form-Data con archivo 'signature'
router.put(
    '/signature', 
    [authenticationUser, upload.single('signature')], 
    updateSignature
);

// DELETE: Borrar firma (Vuelve al estado de firma manual)
// Requiere: Token
router.delete(
    '/signature', 
    [authenticationUser], 
    removeSignature
);

export default router;