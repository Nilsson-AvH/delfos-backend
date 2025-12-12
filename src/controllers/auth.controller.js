import { verifyEncryptedPassword } from "../helpers/bcrypt.helper.js";
import { generateToken } from "../helpers/jwt.helper.js";
import { dbGetUserByEmail } from "../services/user.service.js";

const loginUser = async (req, res) => {
    const inputData = req.body;

    // Paso 1: Buscar el usuario No existeen la base de datos (Por favor registrese)

    const userFound = await dbGetUserByEmail(inputData.email);

    if (!userFound) {
        return res.json({
            msg: `Usuario no encontrado, por favor haga su registro.`
        });
    }

    // Paso 2: Compara la contraseña

    const isMatch = await verifyEncryptedPassword(inputData.password, userFound.password);

    if (!isMatch) {
        return res.json({
            msg: `Credenciales incorrectas.`
        });
    }

    // Paso 3: Generar la credencial digital o el token

    const payload = {
        id: userFound._id,          // Identificador del usuario, controlar quien hace que en la base de datos
        name: userFound.name,
        email: userFound.email,
        role: userFound.role
    };

    const token = generateToken(payload);

    // Paso 4: Eliminar propiedades con datos sensibles

    // userFound es una BJSON (Binary JSON)
    const jsonUserFound = userFound.toJSON();   // convertir un BJSON a JSON
    delete jsonUserFound.password;              // eliminar la contraseña


    // Paso 5: Generar la respuesta

    res.json({ token, user: jsonUserFound });

};

const renewToken = async (req, res) => {
    // Paso 1: Extrae el payload del objeto request que hemos asignado desde el middleweare de autenticacion
    const payload = req.payload;

    // Paso 2: Eliminar propiedades con datos no necesarios
    delete payload.iat;
    delete payload.exp;

    // Paso 3: Verificar que el usuario siga exitiendo en la base de datos
    const userFound = await dbGetUserByEmail(payload.email);

    if (!userFound) {
        return res.json({
            msg: `Usuario ya no existe, No puede renovar el token.`
        });
    }

    // Paso 4: Generar un nuevo token
    const token = generateToken({
        id: userFound._id,          // Identificador del usuario, controlar quien hace que en la base de datos
        name: userFound.name,
        email: userFound.email,
        role: userFound.role
    });

    // Paso 5: Eliminar propiedades con datos sensibles
    const jsonUserFound = userFound.toObject();
    delete jsonUserFound.password;
    delete jsonUserFound.id;

    // Paso 6: Generar la respuesta al cliente
    res.json({ token, user: jsonUserFound });
};

export {
    loginUser,
    renewToken
}
