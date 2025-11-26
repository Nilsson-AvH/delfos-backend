const express = require("express");         // Import the express module
const app = express();                      // Create an instance of express 
const PORT = 3000;

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));