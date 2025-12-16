import express from "express";
import { createClientManagerUser, deleteClientManagerUserById, getAllClientManagerUsers, getClientManagerUserById, updateClientManagerUserById } from "../../controllers/clientManagerUser.controller.js";

const router = express.Router();

// Definicion de las rutas (EndPoints)
router.post(`/`, createClientManagerUser)
router.get(`/`, getAllClientManagerUsers)
router.get(`/:idClientManagerUser`, getClientManagerUserById) // Parametro de ruta: Crear un parametro de ruta que funje como variable para obtener un usuario por id
router.patch(`/:idClientManagerUser`, updateClientManagerUserById)
router.delete(`/:idClientManagerUser`, deleteClientManagerUserById)

export default router;