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

// =====================================================================
// 1. CREACIÓN DE REGISTROS (CREATE)
// =====================================================================

/**
 * Registra un Usuario Base (Identidad) en la colección 'users'.
 * @param {Object} newUser - Objeto con datos básicos (email, nombre, rol).
 * @returns {Promise} Retorna el documento creado.
 */
const dbRegisterUser = async (newUser) => {
    // .create() valida los datos contra el Schema y guarda en Mongo.
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
 * Registra un Usuario Administrativo (Admin/Auditor).
 * @param {Object} newUser - Objeto con credenciales de acceso.
 */
const dbRegisterAdministrativeUser = async (newUser) => {
    return await administrativeUser.create(newUser);
};

/**
 * Registra un Gestor de Cliente (Representante de la empresa).
 * @param {Object} newUser - Objeto con datos del manager.
 */
const dbRegisterClientManagerUser = async (newUser) => {
    return await clientManagerUser.create(newUser);
};

// =====================================================================
// 2. LECTURA DE DATOS - LISTAR TODOS (READ ALL)
// =====================================================================

/**
 * Obtiene TODOS los usuarios base del sistema.
 * @returns {Promise<Array>} Array con todos los documentos.
 */
const dbGetAllUsers = async () => {
    return await userModel.find();
};

/**
 * Obtiene TODOS los usuarios operativos.
 */
const dbGetAllOperationalUsers = async () => {
    return await operationalUser.find();
};

/**
 * Obtiene TODOS los usuarios administrativos.
 */
const dbGetAllAdministrativeUsers = async () => {
    return await administrativeUser.find();
};

/**
 * Obtiene TODOS los gestores de clientes.
 */
const dbGetAllClientManagerUsers = async () => {
    return await clientManagerUser.find();
};


// =====================================================================
// 3. LECTURA DE DATOS - BUSCAR POR ID (READ ONE)
// =====================================================================

/**
 * Busca un usuario base por su ID único (_id de MongoDB).
 * @param {String} _id - Identificador del usuario.
 */
const dbGetUserById = async (_id) => {
    return await userModel.findOne({ _id });
};

const dbGetOperationalUserById = async (_id) => {
    return await operationalUser.findOne({ _id });
};

const dbGetAdministrativeUserById = async (_id) => {
    return await administrativeUser.findOne({ _id });
};

const dbGetClientManagerUserById = async (_id) => {
    return await clientManagerUser.findOne({ _id });
};

// =====================================================================
// 3.1. LECTURA DE PERFILES ESPECÍFICOS (POR USER ID)
// =====================================================================

/**
 * Busca el perfil OPERATIVO asociado a un User ID.
 * Incluye (.populate) toda la información relacionada: Cliente, Contrato, Salud, Docs.
 */
const dbGetOperationalProfileByUserId = async (userId) => {
    return await operationalUser.findOne({ user: userId })
        .populate('clienteActual', 'companyName nit') // Trae solo nombre y NIT de la empresa
        .populate('contractActual')                   // Trae todo el contrato
        .populate('parafiscalesActuales')             // Trae toda la seguridad social
        .populate('documents');                       // Trae el array de documentos
};

/**
 * Busca el perfil ADMINISTRATIVO asociado a un User ID.
 */
const dbGetAdministrativeProfileByUserId = async (userId) => {
    return await administrativeUser.findOne({ user: userId });
};

/**
 * Busca el perfil GESTOR DE CLIENTE asociado a un User ID.
 */
const dbGetClientManagerProfileByUserId = async (userId) => {
    return await clientManagerUser.findOne({ user: userId });
};

// =====================================================================
// 4. ACTUALIZACIÓN DE DATOS (UPDATE)
// =====================================================================

/**
 * Actualiza un usuario base por su ID.
 * @param {String} _id - ID del usuario a modificar.
 * @param {Object} updatedData - Objeto con los campos a cambiar.
 * @returns {Promise} El documento YA actualizado.
 */
const dbUpdateUserById = async (_id, updatedData) => {
    return await userModel.findByIdAndUpdate(
        _id,           // 1. A quién actualizo
        updatedData,   // 2. Con qué datos
        { new: true }  // 3. Opciones: { new: true } devuelve el dato nuevo, no el viejo.
    );
};

const dbUpdateOperationalUserById = async (_id, updatedData) => {
    return await operationalUser.findByIdAndUpdate(_id, updatedData, { new: true });
};

const dbUpdateAdministrativeUserById = async (_id, updatedData) => {
    return await administrativeUser.findByIdAndUpdate(_id, updatedData, { new: true });
};

const dbUpdateClientManagerUserById = async (_id, updatedData) => {
    return await clientManagerUser.findByIdAndUpdate(_id, updatedData, { new: true });
};


// =====================================================================
// 5. ELIMINACIÓN DE DATOS (DELETE)
// =====================================================================

/**
 * Elimina un usuario base por su ID.
 * @param {String} _id - ID del usuario a eliminar.
 */
const dbDeleteUserById = async (_id) => {
    return await userModel.findOneAndDelete({ _id });
};

const dbDeleteOperationalUserById = async (_id) => {
    return await operationalUser.findOneAndDelete({ _id });
};

const dbDeleteAdministrativeUserById = async (_id) => {
    return await administrativeUser.findOneAndDelete({ _id });
};

const dbDeleteClientManagerUserById = async (_id) => {
    return await clientManagerUser.findOneAndDelete({ _id });
};


// =====================================================================
// EXPORTACIÓN DE FUNCIONES
// =====================================================================
// Exportamos todo como un objeto para que la folder CONTROLLER pueda usarlos.
export {
    // Registro
    dbRegisterUser,
    dbRegisterOperationalUser,
    dbRegisterAdministrativeUser,
    dbRegisterClientManagerUser,

    // Listar Todos
    dbGetAllUsers,
    dbGetAllOperationalUsers,
    dbGetAllAdministrativeUsers,
    dbGetAllClientManagerUsers,

    // Buscar por ID
    dbGetUserById,
    dbGetOperationalUserById,
    dbGetAdministrativeUserById,
    dbGetClientManagerUserById,

    // Buscar por User ID
    dbGetOperationalProfileByUserId,
    dbGetAdministrativeProfileByUserId,
    dbGetClientManagerProfileByUserId,

    // Actualizar
    dbUpdateUserById,
    dbUpdateOperationalUserById,
    dbUpdateAdministrativeUserById,
    dbUpdateClientManagerUserById,

    // Eliminar
    dbDeleteUserById,
    dbDeleteOperationalUserById,
    dbDeleteAdministrativeUserById,
    dbDeleteClientManagerUserById,
};