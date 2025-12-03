// Servicio de usuarios, se debe encargar de la comunicacion directa con la base de datos

import userModel from "../models/user.model.js";

const dbRegisterUser = async (newUser) => {
    return await userModel.create(newUser);
};

const dbGetAllUsers = async () => {
    return await userModel.find();
};

const dbGetUserById = async (_id) => {
    return await userModel.findOne({ _id })
}



export {
    dbRegisterUser,
    dbGetAllUsers,
    dbGetUserById
}