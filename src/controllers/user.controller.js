// =====================================================================
// CONTROLADOR DE USUARIOS (USER CONTROLLER)
// =====================================================================
// Este archivo actúa como la "Capa de Control" o "Orquestador".
// SU RESPONSABILIDAD:
// 1. Recibir las peticiones HTTP (req) que vienen del Frontend o Postman.
// 2. Extraer y validar los datos básicos (ej: revisar si viene el 'role').
// 3. Tomar decisiones lógicas (ej: "Si es admin, guarda password; si es manager, guarda cumpleaños").
// 4. Llamar a los Servicios (user.service.js) para que ellos hablen con la Base de Datos.
// 5. Enviar la respuesta final (res) al cliente (Códigos 201, 400, 500, etc.).
// =====================================================================

import {
    dbRegisterUser, dbRegisterOperationalUser, dbRegisterAdministrativeUser, dbRegisterClientManagerUser,
    dbGetAllUsers, dbGetAllOperationalUsers, dbGetAllAdministrativeUsers, dbGetAllClientManagerUsers,
    dbGetUserById, dbGetOperationalUserById, dbGetAdministrativeUserById, dbGetClientManagerUserById,
    dbGetOperationalProfileByUserId, dbGetAdministrativeProfileByUserId, dbGetClientManagerProfileByUserId,
    dbUpdateUserById, dbUpdateOperationalUserById, dbUpdateAdministrativeUserById, dbUpdateClientManagerUserById,
    dbDeleteUserById, dbDeleteOperationalUserById, dbDeleteAdministrativeUserById, dbDeleteClientManagerUserById
} from "../services/user.service.js";

import { createOperationalUser } from "./userOperational.controller.js"; // Controlador especializado de operativos
import { encryptPassword } from "../helpers/bcrypt.helper.js"; // Cifrado de contraseñas
import User from "../models/users/User.model.js";

// =====================================================================
// 1. CREACIÓN DE USUARIOS (LOGICA MAESTRA)
// =====================================================================
const createUser = async (req, res) => {
    try {
        const inputData = req.body;
        const { role } = inputData; // Extraemos el rol para saber qué camino tomar

        // --- CORRECCIÓN CRÍTICA: Definir requesterRole ---
        // Extraemos quién hace la petición desde el token
        const requesterRole = req.payload ? req.payload.role : null;

        // Validación básica
        if (!role) {
            return res.status(400).json({ msg: "El campo 'role' es obligatorio." });
        }

        let result;

        // --- SEMÁFORO DE LÓGICA SEGÚN EL ROL ---
        switch (role) {

            // CASO A: Administrativos
            case 'root':
            case 'superadmin':
            case 'admin':
            case 'auditor':
                // --- LA EXCEPCIÓN DEL REY ---
                // Si el que pide es 'root', lo dejamos pasar.
                if (requesterRole === 'root') {
                    result = await createAdministrativeProfile(inputData);
                    break;
                }

                // Para cualquier otro mortal (incluso SuperAdmin), puerta cerrada.
                return res.status(403).json({
                    msg: "Acción no permitida. Solo el usuario ROOT puede crear administrativos manualmente."
                });

            // CASO B: GESTOR CLIENTE (Requiere Usuario Base + Datos Manager)
            case 'clientManager':
                result = await createClientManagerProfile(inputData);
                break;

            // CASO C: OPERATIVO (El "Monstruo")
            case 'operational':
                // -----------------------------------------------------------
                // CAMBIO CLAVE: DELEGACIÓN DE CONTROL
                // -----------------------------------------------------------
                // Llamamos directamente a la función del otro archivo.
                // Le pasamos (req, res) para que él maneje la transacción y la respuesta.
                // Usamos 'return' para salirnos de esta función inmediatamente.
                return await createOperationalUser(req, res);

            // CASO D: REGISTRADO SIMPLE (Solo Usuario Base)
            case 'registered':
                result = await dbRegisterUser(inputData);
                break;

            default:
                return res.status(400).json({ msg: `El rol '${role}' no es válido para registro.` });
        }

        // Respuesta Exitosa
        res.status(201).json({
            msg: "Usuario creado exitosamente",
            data: result
        });

    } catch (error) {
        console.error(error);
        // Manejo de errores comunes de Mongoose (ej: duplicados)
        if (error.code === 11000) {  // Exepcion de mongoose 11000 (duplicado)
            return res.status(400).json({ msg: "El correo o la cédula ya están registrados." });
        }
        res.status(500).json({
            msg: `Error al crear el usuario`,
            error: error.message
        });
    }
};

// =====================================================================
// FUNCIONES AUXILIARES DE CREACIÓN (Helpers)
// =====================================================================

// Lógica para crear Administrativos (Paso 1: User Base -> Paso 2: Admin Profile)
async function createAdministrativeProfile(data) {
    // 1. Crear Usuario Base
    const userBase = await dbRegisterUser({
        nuip: data.nuip,
        names: data.names,
        lastName: data.lastName,
        secondLastName: data.secondLastName,
        email: data.email,
        role: data.role,
        status: 'active'
    });

    // 2. Cifrar contraseña ANTES DE GUARDAR
    if (!data.password) throw new Error("La contraseña es obligatoria para roles administrativos.");
    const hashPassword = encryptPassword(data.password);

    // 2. Crear Perfil Administrativo vinculado
    const adminProfile = await dbRegisterAdministrativeUser({
        user: userBase._id, // ¡Aquí está la magia de la referencia!
        password: hashPassword // Usar el hash, no la contraseña original
    });

    return { user: userBase, profile: adminProfile };
}

// Lógica para crear Managers (Paso 1: User Base -> Paso 2: Manager Profile)
async function createClientManagerProfile(data) {
    // 1. Crear Usuario Base
    const userBase = await dbRegisterUser({
        nuip: data.nuip,
        names: data.names,
        lastName: data.lastName,
        secondLastName: data.secondLastName,
        email: data.email,
        role: 'clientManager',
        status: 'active'
    });

    // 2. Crear Perfil Manager vinculado (ACTUALIZADO A INGLÉS)
    const managerProfile = await dbRegisterClientManagerUser({
        user: userBase._id,

        // Mapeo de campos nuevos
        birthDate: data.birthDate,       // Antes: data.fechaNacimiento
        birthPlace: data.birthPlace,     // Antes: data.lugarNacimiento
        issueDate: data.issueDate,       // Antes: data.fechaExpedicion
        issuePlace: data.issuePlace,     // Antes: data.lugarExpedicion
        nationality: data.nationality,   // Antes: data.nacionalidad
        phones: data.phones,             // Antes: data.celulares
        address: data.address
    });

    return { user: userBase, profile: managerProfile };
}


// =====================================================================
// 2. OTROS METODOS DEL CONTROLADOR (CRUD)
// =====================================================================

// =====================================================================
// CONSULTAR TODOS LOS USUARIOS (ACTUALIZADO CON VISIBILIDAD)
// =====================================================================
const getAllUsers = async (req, res) => {
    try {
        const { role, status } = req.query;
        const requesterRole = req.payload.role; // Rol de quien pregunta

        // --- Armar el filtro básico ---
        const query = {};
        if (role) query.role = role;
        if (status) query.status = status;

        // NOTA: Ya no necesitamos tanta lógica manual de "if sensitiveRoles" 
        // porque el servicio (dbGetAllUsers) va a filtrar automáticamente 
        // lo que este rol no puede ver gracias al helper.

        // Llamamos al servicio pasando los filtros Y el rol del solicitante
        const users = await dbGetAllUsers(query, requesterRole);

        res.json(users);

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al obtener usuarios", error });
    }
};

// =====================================================================
// CONSULTAR USUARIO POR ID (ACTUALIZADO CON VISIBILIDAD)
// =====================================================================
const getUserById = async (req, res) => {
    try {
        const { idUser } = req.params;
        const requesterRole = req.payload.role;

        // 1. Buscar el Usuario Base usando el SERVICIO SEGURO
        // (Le pasamos el requesterRole para que aplique el filtro)
        const userFound = await dbGetUserById(idUser, requesterRole);

        // Si el servicio devuelve null, puede ser que no exista 
        // O que el usuario no tenga permiso para verlo.
        if (!userFound) {
            return res.status(404).json({ msg: "Usuario no encontrado o no disponible." });
        }

        let profileData = null;

        // 2. Buscar el Perfil Específico (Esto se mantiene igual)
        switch (userFound.role) {
            case 'operational':
                profileData = await dbGetOperationalProfileByUserId(idUser);
                break;

            case 'admin':
            case 'root':
            case 'superadmin':
            case 'auditor':
                profileData = await dbGetAdministrativeProfileByUserId(idUser);
                break;

            case 'clientManager':
                profileData = await dbGetClientManagerProfileByUserId(idUser);
                break;
        }

        res.json({
            msg: "Usuario encontrado",
            user: userFound,
            profile: profileData
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: `Error al buscar usuario`, error: error.message });
    }
};

// =====================================================================
// ELIMINAR USUARIO POR ID
// =====================================================================
const deleteUserById = async (req, res) => {
    try {
        const { idUser } = req.params;
        const requesterRole = req.payload.role;

        // 🔒 1. VALIDACIÓN DE SEGURIDAD
        if (requesterRole !== 'root') {
            return res.status(403).json({
                msg: "Acceso denegado. No tiene permisos de eliminación. Contacte a Soporte."
            });
        }

        // 💣 2. EJECUCIÓN
        const userDeleted = await dbDeleteUserById(idUser);

        if (!userDeleted) {
            return res.status(404).json({ msg: "Usuario no encontrado para eliminar" });
        }

        res.json({ msg: "Usuario eliminado correctamente", userDeleted });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: `Error al eliminar el usuario` });
    }
};

// =====================================================================
// ACTUALIZAR USUARIO POR ID (CON JERARQUÍA)
// =====================================================================
const updateUserById = async (req, res) => {
    try {
        const { idUser } = req.params;
        const updateData = req.body;
        const requesterRole = req.payload.role; // Quién hace el cambio

        // 🔒 SEGURIDAD NIVEL 1: ¿Qué campos quieren tocar?
        // (Esta lógica la tenías y es excelente, la mantenemos)
        const restrictedFields = ['role', 'status'];
        const isTouchingRestricted = Object.keys(updateData).some(field => restrictedFields.includes(field));
        const hasHighPrivilege = ['root', 'superadmin'].includes(requesterRole);

        if (isTouchingRestricted && !hasHighPrivilege) {
            return res.status(403).json({
                msg: "Acceso denegado: No tiene permisos para cambiar el Rol o Estatus. Solo cambios básicos permitidos."
            });
        }

        // 🔒 SEGURIDAD NIVEL 2: ¿A QUIÉN quieren tocar? (Jerarquía)
        // Pasamos el requesterRole para que el servicio aplique el filtro de visibilidad.
        const updatedUser = await dbUpdateUserById(idUser, updateData, requesterRole);

        if (!updatedUser) {
            // Si devuelve null es porque:
            // 1. El usuario no existe.
            // 2. O el usuario existe PERO tiene un rango superior al mío (es invisible para mí).
            return res.status(404).json({ msg: "Usuario no encontrado o no autorizado para editar." });
        }

        res.json({ msg: "Usuario actualizado", user: updatedUser });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al actualizar usuario", error });
    }
};

// Exportar
export {
    createUser,
    getAllUsers,
    getUserById,
    deleteUserById,
    updateUserById
};