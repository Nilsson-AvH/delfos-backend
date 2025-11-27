const express = require("express");         // Import the express module
const app = express();                      // Create an instance of express 
const PORT = 3000;

app.get(`/health`, (req, res) => {
    // res.send("<h1>Server Health is running</h1>")
    res.json([
        {message: "Server Health is running"},
        {message: "This server is Juana La Monda"},
        {message: "This is the best server in the world"}]);
});

//Middlewares express
app.use(`/api/v1/users`, require(`./routes/users.route.js`));
app.use(`/api/v1/employees`, require(`./routes/employees.route.js`));

app.listen(PORT, () => console.log(`:) :) Server running on http://localhost:${PORT}`));