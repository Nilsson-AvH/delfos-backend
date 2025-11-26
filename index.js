const express = require("express");         // Import the express module

const app = express();                      // Create an instance of express 
const PORT = 3000;

//Definir las rutas
app.get(`/`, (req, res) => {
    res.send("<h1>Server in home</h1>")
});

app.get(`/health`, (req, res) => {
    res.send("<h1>Server is running</h1>")
});

app.listen(PORT, () => console.log(`:) :) Server running on http://localhost:${PORT}`));