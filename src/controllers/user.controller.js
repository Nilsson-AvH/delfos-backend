// Controlador de usuarios, se debe encargar de recibir las peticiones y enviar las respuestas

import { registerUser } from "../services/user.service.js";

const createUser = async (req, res) => {
    // se controla la exepcion que ocurre en el paso dos
    try {
        // Paso uno: Obteniendo los datos del body postman
        const data = req.body;

        // Lo muestra en la consola
        console.log(data);

        // Paso dos: Registrar los datos en la base de datos usando el userModel
        const dataRegistered = await registerUser(data);


        // Paso tres: Responde con un JSON al cliente
        res.json({
            msg: `Create users`,
            dataRegistered  //ECMAScript 2015 (ES6) Shorthand property (data: data)
        });

    } catch (error) {
        // Paso cuatro: Responde con un JSON al cliente con la exepcion
        console.error(error);
        res.json({
            msg: `Error al crear el usuario`
        });
    }
};

// Exportar el controlador
export {
    createUser
}