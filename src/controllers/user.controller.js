// Controlador de usuarios, se debe encargar de recibir las peticiones y enviar las respuestas

import userModel from "../models/user.model.js";
import { dbRegisterUser, dbGetAllUsers, dbGetUserById, dbDeleteUserById } from "../services/user.service.js";

const createUser = async (req, res) => {
    // se controla la exepcion que ocurre en el paso dos
    try {
        // Paso uno: Obteniendo los datos del body postman
        const data = req.body;

        // Lo muestra en la consola
        console.log(data);

        // Paso dos: Registrar los datos en la base de datos usando el userModel
        const dataRegistered = await dbRegisterUser(data);


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

const getAllUsers = async (req, res) => {
    try {
        const users = await dbGetAllUsers();
        res.json({ msg: `Get all users`, users });
    } catch (error) {
        console.error(error);
        res.json({
            msg: `Error al obtener los usuarios`
        });
    }
};

const getUserById = async (req, res) => {

    try {
        const idUser = req.params.idUser;

        const user = await dbGetUserById(idUser);

        res.json({
            user
        });
    } catch (error) {
        console.error(error);
        res.json({
            msg: `Id no encontrado.`
        });
    }
};

const deleteUserById = async (req, res) => {

    try {
        const idUser = req.params.idUser;

        const userDeleted = await dbDeleteUserById(idUser);

        res.json({
            userDeleted
        });

    } catch (error) {
        console.error(error);
        res.json({
            msg: `Error: al eliminar el usuario por id.`
        });
    }


}

// Exportar el controlador
export {
    createUser,
    getAllUsers,
    getUserById,
    deleteUserById
}