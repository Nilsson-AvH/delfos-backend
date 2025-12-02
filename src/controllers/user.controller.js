import userModel from "../models/user.model.js";

const createUser = async (req, res) => {
    const data = req.body; // Obteniendo los datos del body postman

    // Lo muestra en la consola
    console.log(data);

    // Registrar los datos en la base de datos usando el userModel
    const dataRegistered = await userModel.create(data);

    // Responde con un JSON al cliente
    res.json({
        msg: `Create users`,
        dataRegistered  //ECMAScript 2015 (ES6) Shorthand property (data: data)
    });
};

// Exportar el controlador
export {
    createUser
}