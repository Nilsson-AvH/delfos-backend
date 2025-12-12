// Controlador de usuarios, se debe encargar de recibir las peticiones y enviar las respuestas

import userModel from "../models/user.model.js";
import { dbRegisterUser, dbGetAllUsers, dbGetUserById, dbDeleteUserById, dbUpdateUserById, dbGetUserByEmail } from "../services/user.service.js";
import { encryptPassword } from "../helpers/bcrypt.helper.js";

const createUser = async (req, res) => {
    // se controla la exepcion que ocurre en el paso dos
    try {
        // Paso uno: Obteniendo los datos del body postman
        const inputData = req.body;

        // Paso 1: Verificamos si el usuario existe

        const userFound = await dbGetUserByEmail(inputData.email);

        if (userFound) {
            return res.json({
                msg: `No se puede registrar, el usuario ya existe`
            });
        }

        // Paso 2: Encriptamos la contraseña que envio el usuario
        inputData.password = encryptPassword(inputData.password); // Me devuelve la contraseña encriptada
        console.log(inputData);

        // Paso dos: Registrar los datos en la base de datos usando el userModel
        const dataRegistered = await dbRegisterUser(inputData);

        // Paso 3: Eliminar propiedades con datos sensibles
        const jsonUserFound = dataRegistered.toJSON();
        delete jsonUserFound.password;

        // Paso tres: Responde con un JSON al cliente
        res.json({
            // msg: `Create users`,
            user: jsonUserFound  //ECMAScript 2015 (ES6) Shorthand property (data: data)
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
        res.json({
            users
        });
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

        const userFound = await dbGetUserById(idUser);

        res.json({
            userFound
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


};

const updateUserById = async (req, res) => {

    try {
        const inputData = req.body;
        const idUser = req.params.idUser;

        const userUpdated = await dbUpdateUserById(idUser, inputData);

        res.json({
            userUpdated
        });

    } catch (error) {
        console.error(error);
        res.json({
            msg: `Error: al actualizar el usuario por id.`
        });
    }

}

// Exportar el controller al archivo user.route.js
export {
    createUser,
    getAllUsers,
    getUserById,
    deleteUserById,
    updateUserById
}