const authorizationUser = (req, res, next) => {

    // 1. Obtenemos el rol del usuario (que vino del authentication middleware)
    const { role } = req.payload;

    // 2. Obtenemos el método HTTP que está intentando ejecutar (GET, POST, DELETE...)
    const method = req.method;

    console.log(`🛡️ Autorización: Rol [${role}] intentando [${method}]`);

    // =================================================================
    // NIVEL 1: ROOT (Acceso Total incluido Gestionar Usuarios)
    // =================================================================
    if (role === 'root') {
        // Root puede hacer todo (POST, GET, PATCH, DELETE)
        return next();
    }

    // =================================================================
    // NIVEL 2: SUPERADMIN (Sin Delete, Gestionar Usuarios)
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
    // NIVEL 3: ADMIN (Sin Delete, Ni Gestionar Usuarios)
    // =================================================================
    if (role === 'admin') {
        if (method === 'DELETE') {
            return res.status(403).json({
                msg: "Acceso denegado: Los administradores no pueden eliminar registros. Contacte a Soporte."
            });
        }
        // Puede hacer POST, GET, PATCH, PUT
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
    // NIVEL 5: OTROS (Sin acceso al módulo de Usuarios)
    // =================================================================
    // Si es operational, client, registered, etc., no deberían estar tocando
    // el CRUD de usuarios administrativos.
    return res.status(403).json({
        msg: `Acceso denegado: El rol '${role}' no tiene permisos para gestionar usuarios.`
    });

};

export default authorizationUser;