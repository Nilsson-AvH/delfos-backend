import express from "express";         // Import the express module
import dbConnection from "./config/mongo.config.js";
import authRoute from "./routes/auth.route.js";
import usersRoute from "./routes/users.route.js";

const app = express();                      // Create an instance of express 
const PORT = process.env.PORT || 3001;

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

app.use('/api/v1/auth', authRoute);    //Login/Register/RenewTokin
app.use(`/api/v1/users`, usersRoute);  //CRUD de usuarios cuando el usuario esta autenticado 
// app.use(`/api/v1/employees`, employeesRoute);

app.listen(PORT, () => console.log(`:) :) Server running on http://localhost:${PORT}`));