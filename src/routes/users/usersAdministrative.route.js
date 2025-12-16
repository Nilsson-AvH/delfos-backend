import express from "express";
import { createAdminUser, deleteAdminUserById, getAllAdminUsers, getAdminUserById, updateAdminUserById } from "../controllers/adminUser.controller.js";

const router = express.Router();

// Definicion de las rutas (EndPoints)
router.post(`/`, createAdminUser)
router.get(`/`, getAllAdminUsers)
router.get(`/:idAdminUser`, getAdminUserById) // Parametro de ruta: Crear un parametro de ruta que funje como variable para obtener un usuario por id
router.patch(`/:idAdminUser`, updateAdminUserById)
router.delete(`/:idAdminUser`, deleteAdminUserById)

export default router;