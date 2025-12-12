// Mongoose ODM, ORM
// const mongoose = require(`mongoose`); esto es commonJS
import mongoose from "mongoose";

// const MONGODB_URI = `mongodb://localhost:27017/db-delfos`;
const MONGODB_URI = process.env.DB_URI || `mongodb+srv://nlr519com_db_user:Delfos@cluster0.74ccfpr.mongodb.net/db-delfos-default`;

const dbConnection = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {});
        console.log(`Conectado a la base de datos`);
    }
    catch (error) {
        // console.error(error);    
        console.error(`Error de conexion con la base de datos :(`);
    }
}

// module.exports = dbConnection; esto es commonJS
export default dbConnection;