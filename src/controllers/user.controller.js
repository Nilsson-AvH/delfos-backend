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

// 1. IMPORTACIÓN NUEVA: Traemos el controlador especializado de operativos
import { createOperationalUser } from "./userOperational.controller.js";

// =====================================================================
// 1. CREACIÓN DE USUARIOS (LOGICA MAESTRA)
// =====================================================================
const createUser = async (req, res) => {
    try {
        const inputData = req.body;
        const { role } = inputData; // Extraemos el rol para saber qué camino tomar

        // Validación básica
        if (!role) {
            return res.status(400).json({ msg: "El campo 'role' es obligatorio." });
        }

        let result;

        // --- SEMÁFORO DE LÓGICA SEGÚN EL ROL ---
        switch (role) {

            // CASO A: ADMINISTRATIVO (Requiere Usuario Base + Password)
            case 'admin':
            case 'root':
            case 'auditor':
                result = await createAdministrativeProfile(inputData);
                break;

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

    // 2. Crear Perfil Administrativo vinculado
    const adminProfile = await dbRegisterAdministrativeUser({
        user: userBase._id, // ¡Aquí está la magia de la referencia!
        password: data.password // Recuerda encriptar esto antes en producción
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
// CONSULTAR TODOS LOS USUARIOS
// =====================================================================
const getAllUsers = async (req, res) => {
    try {
        const users = await dbGetAllUsers();
        res.json({ users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: `Error al obtener los usuarios` });
    }
};

// =====================================================================
// CONSULTAR USUARIO POR ID (CON PERFIL COMPLETO)
// =====================================================================
const getUserById = async (req, res) => {
    try {
        const { idUser } = req.params;

        // 1. Buscar el Usuario Base (Identidad)
        // Usamos .lean() para obtener un objeto JS plano (más rápido y limpio)
        const userFound = await dbGetUserById(idUser);//.lean();

        if (!userFound) {
            return res.status(404).json({ msg: "Usuario no encontrado" });
        }

        let profileData = null;

        // 2. Buscar el Perfil Específico según el ROL
        switch (userFound.role) {
            case 'operational':
                // Aquí ocurre la magia del .populate() que definimos en el servicio
                profileData = await dbGetOperationalProfileByUserId(idUser);
                break;

            case 'admin':
            case 'root':
            case 'auditor':
                profileData = await dbGetAdministrativeProfileByUserId(idUser);
                break;

            case 'clientManager':
                profileData = await dbGetClientManagerProfileByUserId(idUser);
                break;

            default:
                // Si es 'registered' o un rol sin perfil extra, no hacemos nada
                break;
        }

        // 3. Responder con la información unificada
        res.json({
            msg: "Usuario encontrado",
            user: userFound,      // Datos de identidad (Nombre, Email, Rol)
            profile: profileData  // Datos extendidos (Contrato, EPS, Celulares, etc.)
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
        const userDeleted = await dbDeleteUserById(idUser);

        if (!userDeleted) {
            return res.status(404).json({ msg: "Usuario no encontrado para eliminar" });
        }
        res.json({ msg: "Usuario eliminado", userDeleted });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: `Error al eliminar el usuario` });
    }
};

// =====================================================================
// ACTUALIZAR USUARIO POR ID
// =====================================================================
const updateUserById = async (req, res) => {
    try {
        const inputData = req.body;
        const { idUser } = req.params;
        const userUpdated = await dbUpdateUserById(idUser, inputData);

        if (!userUpdated) {
            return res.status(404).json({ msg: "Usuario no encontrado para actualizar" });
        }
        res.json({ userUpdated });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: `Error al actualizar el usuario` });
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