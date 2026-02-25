// =====================================================================
// HELPER DE DESARROLLO - BYPASS DE SEGURIDAD
// ⚠️ NUNCA HABILITAR EN PRODUCCIÓN
// =====================================================================

/**
 * Verifica si el modo bypass está habilitado
 * @returns {boolean}
 */
export const isBypassEnabled = () => {
    return (
        process.env.NODE_ENV === 'development' &&
        process.env.DEV_BYPASS_ENABLED === 'true'
    );
};

/**
 * Verifica si la petición tiene el token mágico de desarrollo
 * @param {Request} req - Objeto request de Express
 * @returns {boolean}
 */
export const hasDevToken = (req) => {
    const devToken = req.header('X-Token-Dev');
    return devToken === 'DESARROLLO_2025'; // Token secreto de desarrollo
};

/**
 * Simula un payload de usuario para desarrollo
 * @returns {Object}
 */
export const getDevPayload = () => {
    return {
        id: process.env.DEV_USER_ID || '507f1f77bcf86cd799439011',
        // role: process.env.DEV_USER_ROLE || 'root',
        role: 'superadmin', // Cambiar manualmente el role del bypass root//superadmin//admin//auditor
        email: process.env.DEV_USER_EMAIL || 'dev@delfos.com',
        name: 'dev_root',
        nuip: '1234567890',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (8 * 3600) // 8 horas
    };
};

/**
 * Log de advertencia cuando se usa bypass
 */
export const logBypassWarning = (middleware) => {
    console.warn(`
╔════════════════════════════════════════════════════════════╗
║  🔓 MODO DESARROLLO ACTIVO                                 ║
║  Middleware: ${middleware.padEnd(42)}    ║
║  ⚠️  BYPASS DE SEGURIDAD HABILITADO                        ║
║  🚫 NUNCA USAR EN PRODUCCIÓN                               ║
╚════════════════════════════════════════════════════════════╝
  `);
};
