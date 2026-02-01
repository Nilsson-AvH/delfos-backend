import { isBypassEnabled, hasDevToken, logBypassWarning } from "../helpers/dev.helper.js";

const authorizationUser = (req, res, next) => {
    // =====================================================================
    // 🔧 MODO DESARROLLO: BYPASS DE AUTORIZACIÓN
    // =====================================================================
    if (isBypassEnabled() && hasDevToken(req)) {
        logBypassWarning('Authorization Middleware');
        return next(); // Bypass total - permite todo
    }

    // =====================================================================
    // PRODUCCIÓN: Validación Normal de Roles
    // =====================================================================

    // 1. Obtenemos el rol del usuario
    const { role } = req.payload;

    // 2. Obtenemos el método HTTP
    const method = req.method;

    console.log(`🛡️ Autorización: Rol [${role}] intentando [${method}]`);

    // =================================================================
    // NIVEL 1: ROOT (Acceso Total)
    // =================================================================
    if (role === 'root') {
        return next();
    }

    // =================================================================
    // NIVEL 2: SUPERADMIN (Sin Delete)
    // =================================================================
    if (role === 'superadmin') {
        if (method === 'DELETE') {
            return res.status(403).json({
                msg: "Acceso denegado: SuperAdmin no tiene permisos de eliminación. Contacte a Soporte."
            });
        }
        return next();
    }

    // =================================================================
    // NIVEL 3: ADMIN (Sin Delete)
    // =================================================================
    if (role === 'admin') {
        if (method === 'DELETE') {
            return res.status(403).json({
                msg: "Acceso denegado: Los administradores no pueden eliminar registros. Contacte a Soporte."
            });
        }
        return next();
    }

    // =================================================================
    // NIVEL 4: AUDITOR (Solo Lectura)
    // =================================================================
    if (role === 'auditor') {
        if (method !== 'GET') {
            return res.status(403).json({
                msg: "Acceso denegado: Perfil de Auditor solo tiene permisos de lectura."
            });
        }
        return next();
    }

    // =================================================================
    // NIVEL 5: OTROS (Sin acceso)
    // =================================================================
    return res.status(403).json({
        msg: `Acceso denegado: El rol '${role}' no tiene permisos para gestionar usuarios.`
    });
};

export default authorizationUser;
