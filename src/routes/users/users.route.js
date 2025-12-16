import express from "express";
import { createUser, deleteUserById, getAllUsers, getUserById, updateUserById } from "../../controllers/user.controller.js";

const router = express.Router();

// Definicion de las rutas (EndPoints)
router.post(`/`, createUser)
router.get(`/`, getAllUsers)
router.get(`/:idUser`, getUserById) // Parametro de ruta: Crear un parametro de ruta que funje como variable para obtener un usuario por id
router.patch(`/:idUser`, updateUserById)
router.delete(`/:idUser`, deleteUserById)
// Exportando el router al archivo index.js,      usando CommonJS module.exports = router; from CommonJS
export default router;