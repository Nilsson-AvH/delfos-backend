/**
 * Retorna un array con los roles que el 'currentRole' NO tiene permitido ver.
 * @param {string} currentRole - El rol del usuario que hace la petición.
 * @returns {string[]} Array de roles excluidos.
 */
const getExcludedRoles = (currentRole) => {
    switch (currentRole) {
        case 'root':
            // EL OJO QUE TODO LO VE: No se le oculta nada.
            return [];

        case 'superadmin':
            // No puede ver a sus jefes (root) ni a sus iguales (superadmin)
            return ['root', 'superadmin'];

        case 'admin':
            // No puede ver a jefes (root, superadmin) ni a sus iguales (admin)
            return ['root', 'superadmin', 'admin'];

        case 'auditor':
            // El auditor audita procesos, no a la gerencia ni a otros auditores.
            // No ve a nadie de la cúpula administrativa ni a sus iguales.
            return ['root', 'superadmin', 'admin', 'auditor'];

        default:
            // Por seguridad, cualquier otro rol (ej. 'client', 'operational') 
            // no debería ver a NINGÚN perfil administrativo.
            return ['root', 'superadmin', 'admin', 'auditor', 'registered'];
    }
};

export default getExcludedRoles;
