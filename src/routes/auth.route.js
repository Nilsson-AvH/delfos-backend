import { Router } from "express";
import { createUser } from "../controllers/user.controller.js";
import { loginUser, renewToken } from "../controllers/auth.controller.js";
import authenticationUser from "../middleweares/authentication.middleweare.js";
import authorizationUser from "../middleweares/authorization.middleweare.js";

const router = Router();

// Definir las rutas para la autenticacion
router.post(`/login`, loginUser);
router.post(`/register`, createUser);     //Solo registra y no necesita autenticacion
router.get(
    `/renew-token`,
    [authenticationUser, authorizationUser],
    renewToken
);  //Renueva el token y si el token es valido, no necesita autenticacion

export default router;