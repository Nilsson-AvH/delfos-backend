import express from "express";         // Import the express module
import dbConnection from "./config/mongo.config.js";
// const dbConnection = require(`./config/mongo.config.js`); esto es con commonjs
import usersRoute from "./routes/users.route.js";
import employeesRoute from "./routes/employees.route.js";

const app = express();                      // Create an instance of express 
const PORT = 3000;

dbConnection();

app.get(`/health`, (req, res) => {
    // res.send("<h1>Server Health is running</h1>")
    res.json([
        {message: "Server Health is running"},
        {message: "This server is Juana La Monda"},
        {message: "This is the best server in the world"}]);
});

//Middlewares express
app.use(`/api/v1/users`, usersRoute);
app.use(`/api/v1/employees`, employeesRoute);

app.listen(PORT, () => console.log(`:) :) Server running on http://localhost:${PORT}`));