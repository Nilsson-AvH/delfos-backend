import { verifyToken } from "../helpers/jwt.helper.js";
// import { isBypassEnabled, hasDevToken, getDevPayload, logBypassWarning } from "../helpers/dev.helper.js";

const authenticationUser = (req, res, next) => {
    try {
        // =====================================================================
        // 🔧 MODO DESARROLLO: BYPASS DE AUTENTICACIÓN
        // =====================================================================
        // if (isBypassEnabled() && hasDevToken(req)) {
        //     logBypassWarning('Authentication Middleware');

        //     // Inyectar payload de desarrollo
        //     const devPayload = getDevPayload();
        //     req.payload = devPayload;
        //     req.userId = devPayload.id;
        //     req.role = devPayload.role;

        //     return next();
        // }

        // =====================================================================
        // PRODUCCIÓN: Validación Normal de JWT
        // =====================================================================

        // Paso 1: Obtener el token
        const token = req.header('X-Token') || req.header('Authorization');

        // Paso 2: Validar que el token no esté vacío
        if (!token) {
            return res.status(401).json({
                msg: `Error Backend: No hay token en la petición`
            });
        }

        // Limpieza del "Bearer " si usas Authorization estándar
        const tokenClean = token.startsWith("Bearer ") ? token.slice(7) : token;

        // Paso 3: Validar que el token sea correcto
        const payload = verifyToken(tokenClean);

        //TODO: Completas validaciones con el ejercicio hecho en clase el 12 de feb 20206, foto en iPhone.

        // Paso 4: Enviar a través del Request los datos del payload
        req.payload = payload;
        req.userId = payload.id;
        req.role = payload.role;

        // Paso 5: Continuar
        next();

    } catch (error) {
        console.log(error);
        res.status(401).json({
            msg: `Error Backend: Token inválido o expirado`
        });
    }
};

export default authenticationUser;
