// Controlador de usuarios, se debe encargar de recibir las peticiones y enviar las respuestas
import { dbRegisterUser, dbGetAllUsers, dbGetUserById, dbDeleteUserById, dbUpdateUserById, dbRegisterUserInfo } from "../services/user.service.js";

const createUser = async (req, res) => {
    // se controla la exepcion que ocurre en el paso dos
    try {
        // Paso uno: Obteniendo los datos del body postman
        const inputData = req.body;

        let dataRegistered;

        if( inputData.userType === "UserInformation") {
            dataRegistered = await dbRegisterUserInfo( inputData );
        }
        else {
            // Paso dos: Registrar los datos en la base de datos usando el userModel
            dataRegistered = await dbRegisterUser(inputData);
        }

        // Lo muestra en la consola
        // console.log(inputData);

        


        // Paso tres: Responde con un JSON al cliente
        res.json({
            // msg: `Create users`,
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