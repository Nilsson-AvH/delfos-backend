import { Router } from "express";
import { createUser } from "../controllers/user.controller.js";
import { loginUser } from "../controllers/auth.controller.js";

const router = Router();

// Definir las rutas para la autenticacion
router.post(`/login`, loginUser);
router.post(`/register`, createUser);     //Solo registra y no necesita autenticacion
// router.get(`/renew-token`, renewToken);  //Renueva el token y si el token es valido, no necesita autenticacion

export default router;