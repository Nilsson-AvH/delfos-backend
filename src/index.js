import express from "express";         // Import the express module
import dbConnection from "./config/mongo.config.js";

import usersRoute from "./routes/users/users.route.js";
import contractsRoute from "./routes/contracts.route.js";
import documentsRoute from "./routes/documents.route.js";

const app = express();                      // Create an instance of express 
const PORT = 3000;

dbConnection();

app.get(`/health`, (req, res) => {
    // res.send("<h1>Server Health is running</h1>")
    res.json([
        { message: "Server Health is running" },
        { message: "This server is Juana La Monda" },
        { message: "This is the best server in the world" }]);
});

//Middlewares express
app.use(express.json()); //Middleware para parsear el body de la peticion JSON (Ejemplo matrix trinity helicopter)

app.use(`/api/v1/users`, usersRoute);
app.use(`/api/v1/contracts`, contractsRoute);
app.use(`/api/v1/documents`, documentsRoute);

app.listen(PORT, () => console.log(`:) :) Server running on http://localhost:${PORT}`));