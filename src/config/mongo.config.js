// Mongoose ODM, ORM
const mongoose = require(`mongoose`);

const MONGODB_URI = `mongodb://localhost:27017/db-delfos`;
const dbConnection = async () => {
    try {
        await mongoose.connect( MONGODB_URI , {} );
        console.log(`Conectado a la base de datos`);
    } 
    catch (error) {
        // console.error(error);    
        console.error(`Error de conexion con la base de datos :(`);
    }    
}

module.exports = dbConnection;