import express from "express";
import { createOperationalUser, deleteOperationalUserById, getAllOperationalUsers, getOperationalUserById, updateOperationalUserById } from "../../controllers/operationalUser.controller.js";

const router = express.Router();

// Definicion de las rutas (EndPoints)
router.post(`/`, createOperationalUser)
router.get(`/`, getAllOperationalUsers)
router.get(`/:idOperationalUser`, getOperationalUserById) // Parametro de ruta: Crear un parametro de ruta que funje como variable para obtener un usuario por id
router.patch(`/:idOperationalUser`, updateOperationalUserById)
router.delete(`/:idOperationalUser`, deleteOperationalUserById)

export default router;