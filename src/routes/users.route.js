// const express = require("express"); from CommonJS
import express from "express";
import { createUser, getAllUsers, getUserById } from "../controllers/user.controller.js";

const router = express.Router();

// Definicion de las rutas (EndPoints)

router.post(`/`, createUser)

router.get(`/`, getAllUsers)

router.get(`/:idUser`, getUserById) // Parametro de ruta: Crear un parametro de ruta que funje como variable para obtener un usuario por id

// router.put(`/`, (req, res) => {
//     res.json({ msg: `Update users actualizatodos los usuarios` });
// })

// router.patch(`/`, (req, res) => {
//     res.json({ msg: `Patch user, actualiza parcialmente un usuario` });
// })

// router.delete(`/`, (req, res) => {
//     res.json({ msg: `Delete users` });
// })

// Exportando el router usando CommonJS
// module.exports = router; from CommonJS
export default router;