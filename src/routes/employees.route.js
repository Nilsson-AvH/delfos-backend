const express = require("express");
const router = express.Router();

// Definicion de las rutas
router.get("/", (req, res) => {
    // res.send("<h1>Server home employees is running</h1>");
    res.json([
        {
            name: "Nilson Lopez",
            id: 12454567,
            job: "Developer"
        },
        {
            name: "Heiber Diaz",
            id: 84873489,
            job: "Developer"
        },
        {
            name: "Juan Carlos Jimenez",
            id: 387570945,
            job: "Teacher Developer"
        }
    ]);
});

module.exports = router;