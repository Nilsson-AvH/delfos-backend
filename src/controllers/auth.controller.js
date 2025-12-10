import { verifyEncryptedPassword } from "../helpers/bcrypt.helper.js";
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

    // Paso 4: Eliminar propiedades con datos sensibles

    // Paso 5: Generar la respuesta

    res.json({
        msg: `Inicio de sesión exitoso.`
    })

};

export {
    loginUser
}
