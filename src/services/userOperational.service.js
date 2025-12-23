// =====================================================================
// SERVICIO DE OPERATIVOS (OPERATIONAL USER SERVICE)
// =====================================================================
// Este archivo se encarga de la comunicación directa con la colección 
// 'operationalusers' en MongoDB.
// =====================================================================

import OperationalUser from "../models/users/UserOperational.model.js";
import Contract from "../models/Contract.model.js";
import SocialSecurity from "../models/SocialSecurity.model.js";
import Client from "../models/Client.model.js";           // Antes era ClientModel
import Document from "../models/Documents.model.js";      // Antes era DocumentModel

// =====================================================================
// 1. LECTURA DE DATOS (READ)
// =====================================================================

/**
 * Obtiene TODOS los usuarios operativos registrados en el sistema.
 * @returns {Promise<Array>} Lista de todos los operarios con sus datos básicos.
 */
const dbGetAllOperationalUsers = async () => {
    return await OperationalUser.find().populate('user');
};

/**
 * Obtiene UN USUARIO OPERATIVO por su ID.
 * @param {string} id - ID del usuario operativo.
 * @returns {Promise<Object>} Objeto del usuario operativo con sus datos.
 */
const dbGetOperationalUserById = async (id) => {
    return await OperationalUser.findById(id).populate('user');
};

/**
 * Obtiene el perfil de un operativo por su ID de usuario.
 * @param {string} userId - ID del usuario.
 * @returns {Promise<Object>} Objeto del perfil del operativo con sus datos.
 */
const dbGetOperationalProfileByUserId = async (userId) => {
    return await OperationalUser.findOne({ user: userId })
        // 1. Datos del Usuario Base
        .populate('user')

        // 2. Datos ACTUALES
        .populate('currentClient', 'companyName nit address phone')
        .populate('currentContract')
        .populate('currentSocialSecurity')
        .populate('documents')

        // 3. HISTORIALES (Deep Populate) - ¡Aquí está el truco!
        .populate({
            path: 'clientHistory.client', // Ruta al modelo Client
            select: 'companyName nit' // Solo traemos lo necesario para la tabla histórica
        })
        .populate({
            path: 'contractHistory.contract', // Ruta al modelo Contract
            select: 'contractContent startDate endDate'
        })
        // 4. Detalles de la seguridad social anterior
        .populate({
            path: 'socialSecurityHistory.socialSecurity', // Ruta al modelo SocialSecurity
            select: 'eps arl'
        });  // Documentos del operativo
};

// =====================================================================
// 2. CREACIÓN DE DATOS (CREATE)
// =====================================================================

/**
 * Crea un nuevo contrato para un operativo.
 * @param {Object} data - Datos del contrato.
 * @param {Object} session - Sesión de transacción.
 * @returns {Promise<Object>} Objeto del contrato creado.
 */
const dbCreateContract = async (data, session) => {
    return await Contract.create([data], { session });
};

/**
 * Crea parafiscales (Social Security) para un operativo.
 * @param {Object} data - Datos del parafiscal.
 * @param {Object} session - Sesión de transacción.
 * @returns {Promise<Object>} Objeto del parafiscal creado.
 */
const dbCreateSocialSecurity = async (data, session) => {
    return await SocialSecurity.create([data], { session });
};

/**
 * Registra un nuevo operativo.
 * @param {Object} data - Datos del operativo.
 * @param {Object} session - Sesión de transacción.
 * @returns {Promise<Object>} Objeto del operativo creado.
 */
const dbRegisterOperationalUser = async (data, session = null) => {
    if (session) {
        return await OperationalUser.create([data], { session });
    }
    return await OperationalUser.create(data);
};

// =====================================================================
// 3. ACTUALIZACIÓN DE DATOS (UPDATE)
// =====================================================================

/**
 * Actualiza un operativo por su ID.
 * @param {string} id - ID del operativo.
 * @param {Object} data - Datos a actualizar.
 * @returns {Promise<Object>} Objeto del operativo actualizado.
 */
const dbUpdateOperationalUserById = async (id, data) => {
    return await OperationalUser.findByIdAndUpdate(id, data, { new: true });
};

// =====================================================================
// 4. ELIMINACIÓN DE DATOS (DELETE)
// =====================================================================

/**
 * Elimina un operativo por su ID.
 * @param {string} id - ID del operativo.
 * @returns {Promise<Object>} Objeto del operativo eliminado.
 */
const dbDeleteOperationalUserById = async (id) => {
    return await OperationalUser.findByIdAndDelete(id);
};

// =====================================================================
// 5. MOVIMIENTOS Y ROTACIÓN (TRANSFER)
// =====================================================================

/**
 * Realiza el traslado de un operario a un nuevo cliente (Puesto).
 * Guarda el rastro del cliente anterior en el historial.
 * @param {String} operationalId - ID del perfil operativo.
 * @param {String} newClientId - ID del nuevo cliente.
 * @param {String} reason - Razón del cambio.
 * @param {Date} oldStartDate - (Opcional) Cuándo empezó en el puesto anterior.
 */
const dbTransferOperationalUser = async (operationalId, newClientId, reason, oldStartDate) => {

    const operational = await OperationalUser.findById(operationalId);
    if (!operational) return null;

    // 1. Verificar si ya está en ese cliente (Evitar traslados redundantes)
    if (operational.currentClient.toString() === newClientId) {
        throw new Error("El usuario ya se encuentra asignado a este cliente.");
    }

    // 2. Preparar el registro histórico (Backup del estado actual)
    const historyEntry = {
        client: operational.currentClient, // El cliente que abandona
        startDate: oldStartDate || operational.updatedAt || new Date(), // Estimación si no se envía
        endDate: new Date(), // Fecha de hoy (Salida)
        changeReason: reason || "Rotación Operativa"
    };

    // 3. Empujar al historial
    operational.clientHistory.push(historyEntry);

    // 4. Actualizar puntero actual
    operational.currentClient = newClientId;

    return await operational.save();
};

// =====================================================================
// 6. RENOVACIÓN DE CONTRATO (Contract Renewal)
// =====================================================================
const dbRenewOperationalContract = async (operationalId, contractData) => {
    // 1. Buscar Usuario
    const operational = await OperationalUser.findById(operationalId);
    if (!operational) return null;

    // 2. Desactivar Contrato Anterior (Si existe)
    if (operational.currentContract) {
        await Contract.findByIdAndUpdate(operational.currentContract, { isActive: false });

        // Guardar en historial
        operational.contractHistory.push({
            contract: operational.currentContract,
            observations: `Renovación: ${new Date().toISOString().split('T')[0]}`
        });
    }

    // 3. Crear Nuevo Contrato
    const newContract = await Contract.create({
        ...contractData,
        isActive: true
    });

    // 4. Asignar nuevo contrato actual
    operational.currentContract = newContract._id;

    return await operational.save();
};

// =====================================================================
// 7. ACTUALIZACIÓN DE SEGURIDAD SOCIAL (SS Update)
// =====================================================================
const dbUpdateOperationalSocialSecurity = async (operationalId, ssData, changeReason) => {
    // 1. Buscar Usuario
    const operational = await OperationalUser.findById(operationalId);
    if (!operational) return null;

    // 2. Guardar el anterior en el historial
    if (operational.currentSocialSecurity) {
        operational.socialSecurityHistory.push({
            socialSecurity: operational.currentSocialSecurity,
            changeDate: new Date(),
            changeReason: changeReason || "Actualización de datos"
        });
    }

    // 3. Crear nuevo registro de Parafiscales
    const newSS = await SocialSecurity.create(ssData);

    // 4. Asignar nuevo actual
    operational.currentSocialSecurity = newSS._id;

    return await operational.save();
};

export {
    dbGetAllOperationalUsers,
    dbGetOperationalUserById,
    dbGetOperationalProfileByUserId,
    dbRegisterOperationalUser,
    dbUpdateOperationalUserById,
    dbDeleteOperationalUserById,
    dbTransferOperationalUser,
    dbRenewOperationalContract,
    dbUpdateOperationalSocialSecurity,

    dbCreateContract,
    dbCreateSocialSecurity
}
