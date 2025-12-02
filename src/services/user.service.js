// Servicio de usuarios, se debe encargar de la comunicacion directa con la base de datos

import userModel from "../models/user.model.js";

const registerUser = async (newUser) => {
    try {
        return await userModel.create(newUser);
    } catch (error) {
        throw error;
    }
}

export {
    registerUser
}