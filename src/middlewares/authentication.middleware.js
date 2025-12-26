import { verifyToken } from "../helpers/jwt.helper.js";

const authenticationUser = (req, res, next) => {
    try {
        // Paso 1: Obtener el string del token (Soporta X-Token o Authorization)
        const token = req.header('X-Token') || req.header('Authorization');

        // Paso 2: Validar que el token no este vacio
        if (!token) {
            return res.status(401).json({
                msg: `Error: No hay token en la petición`
            });
        }

        // Limpieza opcional del "Bearer " si usas Authorization estándar
        const tokenClean = token.startsWith("Bearer ") ? token.slice(7) : token;

        // Paso 3: Validar que el token sea correcto
        const payload = verifyToken(tokenClean);

        // Paso 4: Enviar a traves del Request los datos del payload
        req.payload = payload;
        req.userId = payload.id; // Alias útil

        // Paso 5: Continuar
        next();

    } catch (error) {
        console.log(error);
        res.status(401).json({
            msg: `Error: Token inválido o expirado`
        });
    }
}

export default authenticationUser;