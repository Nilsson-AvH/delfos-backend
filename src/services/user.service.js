// =====================================================================
// SERVICIO DE USUARIOS
// =====================================================================
// Este archivo actúa como la "Capa de Datos". Su única responsabilidad
// es comunicarse directamente con MongoDB usando los modelos de Mongoose.
// El Controlador llamará a estas funciones, y estas funciones llamarán a la BD.
// =====================================================================

import userModel from "../models/users/User.model.js";
import operationalUser from "../models/users/UserOperational.model.js";
import administrativeUser from "../models/users/UserAdministrative.model.js";
import clientManagerUser from "../models/users/UserClientManager.model.js";
import getExcludedRoles from "../helpers/visibility.helper.js";

// =====================================================================
// 1. CREACION DE USUARIOS
// =====================================================================

/**
 * Registra un usuario base. Soporta transacciones.
 * @param {Object} newUser - User data.
 * @param {Object} [session] - (Optional) Mongoose session for transactions.
 */
const dbRegisterUser = async (newUser, session = null) => {
    if (session) {
        return await userModel.create([newUser], { session });
    }
    return await userModel.create(newUser);
};

/**
 * Registra un Usuario Operativo (Vigilante/Operario).
 * @param {Object} newUser - Objeto con datos laborales y personales.
 */
const dbRegisterOperationalUser = async (newUser) => {
    return await operationalUser.create(newUser);
};

/**
 * Registra un Usuario Administrativo (Gerente/Encargado).
 * @param {Object} newUser - Objeto con datos laborales y personales.
 */
const dbRegisterAdministrativeUser = async (newUser) => {
    return await administrativeUser.create(newUser);
};

/**
 * Registra un Usuario Gerente de Clientes (Gerente de Clientes).
 * @param {Object} newUser - Objeto con datos laborales y personales.
 */
const dbRegisterClientManagerUser = async (newUser) => {
    return await clientManagerUser.create(newUser);
};

// =====================================================================
// 2. LECTURA DE DATOS  - LISTAR TODO
// =====================================================================

/**
 * Obtiene todos los usuarios base del sistema con FILTRO DE VISIBILIDAD.
 * @param {Object} queryFilters - Filtros que vienen del controlador (status, role, etc).
 * @param {string} requesterRole - El rol de quien hace la petición.
 * @returns {Array} Array de usuarios filtrados.
 */
const dbGetAllUsers = async (queryFilters = {}, requesterRole) => {
    // 1. Obtenemos la lista negra
    const excludedRoles = getExcludedRoles(requesterRole);

    // 2. Construimos la query final
    // Mantenemos los filtros que ya existían y agregamos la regla de seguridad ($nin)
    const finalQuery = {
        ...queryFilters,
        role: { $nin: excludedRoles }
    };

    return await userModel.find(finalQuery);
};

/**
 * Obtiene todos los usuarios operativos (vigilantes/operarios).
 * @returns {Array} Array de usuarios operativos.
 */
const dbGetAllOperationalUsers = async () => {
    return await operationalUser.find();
};

/**
 * Obtiene todos los usuarios administrativos (gerentes/encargados).
 * @returns {Array} Array de usuarios administrativos.
 */
const dbGetAllAdministrativeUsers = async () => {
    return await administrativeUser.find();
};

/**
 * Obtiene todos los usuarios gerentes de clientes (gerentes de clientes).
 * @returns {Array} Array de usuarios gerentes de clientes.
 */
const dbGetAllClientManagerUsers = async () => {
    return await clientManagerUser.find();
};

// =====================================================================
// 3. LECTURA DE DATOS - LISTAR POR ID (READ ONE BY ID)
// =====================================================================

/**
 * Obtiene un usuario base por su ID respetando la VISIBILIDAD.
 * @param {string} _id - ID del usuario.
 * @param {string} requesterRole - Rol de quien pregunta.
 * @returns {Object} Usuario encontrado o null si está oculto.
 */
const dbGetUserById = async (_id, requesterRole) => {
    // 1. Obtenemos lista negra
    const excludedRoles = getExcludedRoles(requesterRole);

    // 2. Buscamos uno que coincida con el ID Y que NO tenga un rol prohibido
    return await userModel.findOne({
        _id: _id,
        role: { $nin: excludedRoles }
    });
};

/**
 * Obtiene un usuario operativo (vigilante/operario) por su ID.
 * @param {string} _id - ID del usuario.
 * @returns {Object} Usuario operativo encontrado.
 */
const dbGetOperationalUserById = async (_id) => {
    return await operationalUser.findOne({ _id });
};

/**
 * Obtiene un usuario administrativo (gerente/encargado) por su ID.
 * @param {string} _id - ID del usuario.
 * @returns {Object} Usuario administrativo encontrado.
 */
const dbGetAdministrativeUserById = async (_id) => {
    return await administrativeUser.findOne({ _id });
};

/**
 * Obtiene un usuario gerente de clientes (gerente de clientes) por su ID.
 * @param {string} _id - ID del usuario.
 * @returns {Object} Usuario gerente de clientes encontrado.
 */
const dbGetClientManagerUserById = async (_id) => {
    return await clientManagerUser.findOne({ _id });
};

// =====================================================================
// 3.1. LECTURA DE DATOS ESPECIFICOS - LISTAR POR ID (READ SPECIFIC PROFILES BY USER ID)
// =====================================================================

/**
 * Obtiene el perfil operativo asociado con un ID de usuario.
 * Refactor: Actualizado para usar nombres de campos en inglés para populate.
 */
const dbGetOperationalProfileByUserId = async (userId) => {
    return await operationalUser.findOne({ user: userId })
        .populate('user')                               // Trae el usuario
        .populate('currentClient', 'companyName nit')   // Trae el cliente actual
        .populate('currentContract')                    // Trae el contrato actual
        .populate('currentSocialSecurity')              // Trae los parafiscales (Social Security) actuales
        .populate('documents');                         // Trae los documentos
};

/**
 * Obtiene el perfil administrativo asociado con un ID de usuario.
 */
const dbGetAdministrativeProfileByUserId = async (userId) => {
    return await administrativeUser.findOne({ user: userId });
};

/**
 * Obtiene el perfil gerente de clientes asociado con un ID de usuario.
 */
const dbGetClientManagerProfileByUserId = async (userId) => {
    return await clientManagerUser.findOne({ user: userId });
};

// =====================================================================
// 4. ACTUALIZACIÓN DE DATOS - ACTUALIZAR POR ID (CON VISIBILIDAD)
// =====================================================================

/**
 * Actualiza un usuario base por su ID, respetando la jerarquía.
 * @param {String} _id - ID del usuario a modificar.
 * @param {Object} updatedData - Objeto con los campos a cambiar.
 * @param {String} requesterRole - Rol de quien intenta hacer el cambio.
 * @returns {Promise} El documento YA actualizado o null si no tiene permiso.
 */
const dbUpdateUserById = async (_id, updatedData, requesterRole) => {
    // 1. Obtenemos la lista de intocables para este rol
    const excludedRoles = getExcludedRoles(requesterRole);

    // 2. Buscamos por ID **Y** que NO sea un rol prohibido
    return await userModel.findOneAndUpdate(
        {
            _id: _id,
            role: { $nin: excludedRoles } // <--- EL MURO DE SEGURIDAD
        },
        updatedData,
        { new: true } // Para que devuelva el objeto nuevo
    );
};

/**
 * Actualiza un usuario operativo por su ID.
 * @param {String} _id - ID del usuario a modificar.
 * @param {Object} updatedData - Objeto con los campos a cambiar.
 * @returns {Promise} El documento YA actualizado.
 */
const dbUpdateOperationalUserById = async (_id, updatedData) => {
    return await operationalUser.findByIdAndUpdate(_id, updatedData, { new: true });
};

/**
 * Actualiza un usuario administrativo por su ID.
 * @param {String} _id - ID del usuario a modificar.
 * @param {Object} updatedData - Objeto con los campos a cambiar.
 * @returns {Promise} El documento YA actualizado.
 */
const dbUpdateAdministrativeUserById = async (_id, updatedData) => {
    return await administrativeUser.findByIdAndUpdate(_id, updatedData, { new: true });
};

/**
 * Actualiza un usuario gerente de clientes por su ID.
 * @param {String} _id - ID del usuario a modificar.
 * @param {Object} updatedData - Objeto con los campos a cambiar.
 * @returns {Promise} El documento YA actualizado.
 */
const dbUpdateClientManagerUserById = async (_id, updatedData) => {
    return await clientManagerUser.findByIdAndUpdate(_id, updatedData, { new: true });
};


// =====================================================================
// 5. ELIMINACIÓN DE DATOS - ELIMINAR POR ID (DELETE BY ID)
// =====================================================================

/**
 * Elimina un usuario base por su ID.
 * @param {String} _id - ID del usuario a eliminar.
 * @returns {Promise} El documento eliminado.
 */
const dbDeleteUserById = async (_id) => {
    return await userModel.findOneAndDelete({ _id });
};

/**
 * Elimina un usuario operativo por su ID.
 * @param {String} _id - ID del usuario a eliminar.
 * @returns {Promise} El documento eliminado.
 */
const dbDeleteOperationalUserById = async (_id) => {
    return await operationalUser.findOneAndDelete({ _id });
};

/**
 * Elimina un usuario administrativo por su ID.
 * @param {String} _id - ID del usuario a eliminar.
 * @returns {Promise} El documento eliminado.
 */
const dbDeleteAdministrativeUserById = async (_id) => {
    return await administrativeUser.findOneAndDelete({ _id });
};

/**
 * Elimina un usuario gerente de clientes por su ID.
 * @param {String} _id - ID del usuario a eliminar.
 * @returns {Promise} El documento eliminado.
 */
const dbDeleteClientManagerUserById = async (_id) => {
    return await clientManagerUser.findOneAndDelete({ _id });
};


// =====================================================================
// EXPORTACIONES DE FUNCIONES
// =====================================================================
export {
    // Register
    dbRegisterUser,
    dbRegisterOperationalUser,
    dbRegisterAdministrativeUser,
    dbRegisterClientManagerUser,

    // List All
    dbGetAllUsers,
    dbGetAllOperationalUsers,
    dbGetAllAdministrativeUsers,
    dbGetAllClientManagerUsers,

    // Get by ID
    dbGetUserById,
    dbGetOperationalUserById,
    dbGetAdministrativeUserById,
    dbGetClientManagerUserById,

    // Get by User ID (Profiles)
    dbGetOperationalProfileByUserId,
    dbGetAdministrativeProfileByUserId,
    dbGetClientManagerProfileByUserId,

    // Update
    dbUpdateUserById,
    dbUpdateOperationalUserById,
    dbUpdateAdministrativeUserById,
    dbUpdateClientManagerUserById,

    // Delete
    dbDeleteUserById,
    dbDeleteOperationalUserById,
    dbDeleteAdministrativeUserById,
    dbDeleteClientManagerUserById,
};