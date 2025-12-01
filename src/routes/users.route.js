// const express = require("express"); from CommonJS
import express from "express";
const router = express.Router();

// Definicion de las rutas
router.get(`/`, (req, res) => {
    // res.send("<h1>Users server is running</h1>");
    res.json({ msg: `Get all users` });
});

router.post(`/`, (req, res) => {
    const data = req.body; // Obteniendo los datos del body postman

    // Lo muestra en la consola
    console.log(data);

    // Responde con un JSON al cliente
    res.json({
        msg: `Create users`,
        data  //ECMAScript 2015 (ES6) Shorthand property (data: data)
    });
})

// router.put(`/`, (req, res) => {
//     res.json({ msg: `Update users actualiza todos los usuarios` });
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