const express = require("express");
const router = express.Router();

// Definicion de las rutas
router.get(`/`, (req, res) => {
    // res.send("<h1>Users server is running</h1>");
    const users = [
        {
            name: "Nilson Lopez",
            email: "nlr519.com@gmail.com"
        },
        {
            name: "Heiber Diaz",
            email: "heiberdiazp@gmail.com"
        },
        {
            name: "Juan Carlos Jimenez",
            email: "janfojes@gmail.com"
        }
    ];

    res.json( users );
});



// Exportando el router usando CommonJS
module.exports = router;