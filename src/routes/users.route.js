// const express = require("express"); from CommonJS
import express from "express";
import { createUser, deleteUserById, getAllUsers, getUserById, updateUserById } from "../controllers/user.controller.js";
import authorizationUser from "../middleweares/authorization.middleweare.js";
import authenticationUser from "../middleweares/authentication.middleweare.js";

const router = express.Router();

// Definicion de las rutas (EndPoints)

router.post(`/`, [authenticationUser, authorizationUser], createUser)

router.get(`/`, [authenticationUser, authorizationUser], getAllUsers)

router.get(`/:idUser`, [authenticationUser, authorizationUser], getUserById) // Parametro de ruta: Crear un parametro de ruta que funje como variable para obtener un usuario por id

router.delete(`/:idUser`, [authenticationUser, authorizationUser], deleteUserById)

router.patch(`/:idUser`, [authenticationUser, authorizationUser], updateUserById)

// router.put(`/`, (req, res) => {
//     res.json({ msg: `Update users actualizatodos los usuarios` });
// })

// Exportando el router al archivo index.js,      usando CommonJS module.exports = router; from CommonJS
export default router;