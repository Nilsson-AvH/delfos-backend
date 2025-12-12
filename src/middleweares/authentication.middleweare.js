import { verifyToken } from "../helpers/jwt.helper.js";

const authenticationUser = (req, res, next) => {

    try {
        // Paso 1: Obtener el string del token
        const token = req.header(`X-Token`)

        // Paso 2: Validar que el token no este vacio
        if (!token) {
            return res.json({
                msg: `Error: No hay token en la peticion`
            });
        }

        // Paso 3: Validar que el token sea correcto

        const payload = verifyToken(token);

        console.log(`Middleweare de autenticacion: ${payload}`);

        // Paso 4: Enviar a traves del Request los datos del payload

        req.payload = payload;

        // Paso 5: Saltar a la siguiente funcion definida en la ruta

        next();

    } catch (error) {

        console.log(error);
        res.json({
            msg: `Error: Token invalido`
        });

    }

}

export default authenticationUser;