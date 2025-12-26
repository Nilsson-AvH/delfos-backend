import { Router } from "express";
import { register, loginUser, renewToken } from "../controllers/auth.controller.js";
import authenticationUser from "../middlewares/authentication.middleware.js";
import authorizationUser from "../middlewares/authorization.middleware.js";

const router = Router();

// Definir las rutas para la autenticacion
router.post('/login', loginUser);     //Inicia sesion, requiere autenticacion
router.post(`/register`, register);     //Registra un nuevo usuario, requiere autenticacion del superadmin
router.get(
    '/renew-token',
    [authenticationUser, authorizationUser], // Requiere autenticacion y autorizacion
    renewToken
);  //Renueva el token y si el token es valido, no necesita autenticacion

export default router;