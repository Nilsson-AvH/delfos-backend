// Servicio de usuarios, se debe encargar de la comunicacion directa con la base de datos

import { userInformationModel, userModel } from "../models/User.model.js";

const dbRegisterUser = async (newUser) => {
    return await userModel.create(newUser);
};

const dbRegisterUserInfo = async (newUser) => {
    return await userInformationModel.create(newUser);
};

const dbGetAllUsers = async () => {
    return await userModel.find();
};

const dbGetUserById = async (_id) => {
    return await userModel.findOne({ _id })
};

const dbDeleteUserById = async (_id) => {
    return await userModel.findOneAndDelete({ _id });
};

const dbUpdateUserById = async (_id, updatedData) => {
    return await userModel.findByIdAndUpdate(
        _id,            // ID
        updatedData,    // Datos a actualizar
        { new: true }   // Opciones Configuraciones, new: true para que retorne el documento actualizado
    );
    // return await userModel.findOneAndUpdate({ _id }, updatedData, { new: true });
}

// Exportar las funciones al archivo user.controller.js
export {
    dbRegisterUser,
    dbGetAllUsers,
    dbGetUserById,
    dbDeleteUserById,
    dbUpdateUserById,
    dbRegisterUserInfo
}