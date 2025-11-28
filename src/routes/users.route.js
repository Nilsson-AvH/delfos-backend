const express = require("express");
const router = express.Router();

// Definicion de las rutas
router.get(`/`, (req, res) => {
    // res.send("<h1>Users server is running</h1>");
    res.json({ msg: `Get all users` });
});

router.post(`/`, (req, res) => {
    res.json({ msg: `Create users` });
})

router.put(`/`, (req, res) => {
    res.json({ msg: `Update users actualiza todos los usuarios` });
})

router.patch(`/`, (req, res) => {
    res.json({ msg: `Patch user, actualiza parcialmente un usuario` });
})

router.delete(`/`, (req, res) => {
    res.json({ msg: `Delete users` });
})

// Exportando el router usando CommonJS
module.exports = router;