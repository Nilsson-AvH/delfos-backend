// const express = require("express"); from CommonJS
import express from "express";
import { createUser, getAllUsers } from "../controllers/user.controller.js";

const router = express.Router();

// Definicion de las rutas

router.post(`/`, createUser)

router.get(`/`, getAllUsers)

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