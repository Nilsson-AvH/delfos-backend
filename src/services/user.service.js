// Servicio de usuarios, se debe encargar de la comunicacion directa con la base de datos

import userModel from "../models/user.model.js";

const registerUser = async (newUser) => {
    return await userModel.create(newUser);
}

export {
    registerUser
}