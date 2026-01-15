import { encryptPassword, verifyEncryptedPassword } from "../helpers/bcrypt.helper.js"; // Usamos tus helpers
import { generateToken } from "../helpers/jwt.helper.js";
import User from "../models/users/User.model.js";
import AdministrativeUser from "../models/users/UserAdministrative.model.js"; // Ojo con el nombre del archivo, asegúrate que sea correcto en tu proyecto

// Importamos el middleware para subir signature del usuario administrativo
import { srvSaveCompanyFile } from "../services/storage/storage.service.js";

// =================================================================
// REGISTRO PÚBLICO ADMINISTRATIVO
// =================================================================
const register = async (req, res) => {
    try {

        // Extraemos los datos del body
        const { 
            nuip, 
            names, 
            lastName, 
            secondLastName, 
            email, 
            password, 
            roleRequest,
            jobTitle
        } = req.body;
        
        const file = req.file;

        // 1. Crear Usuario Base (Identidad)
        const newUser = await User.create({
            nuip,
            names,
            lastName,
            secondLastName,
            email,
            role: 'registered',
            status: 'inactive',
            requestedRole: roleRequest
        });

        // 2. Cifrar contraseña usando tu helper
        const hashPassword = await encryptPassword(password); // Helper asíncrono

        // 3. PROCESAR FIRMA (STORAGE HÍBRIDO) ✍️
        let signatureData = {};

        if (file) {
            const extension = file.mimetype.split('/')[1] || 'png';
            
            // Guardamos usando el servicio maestro (Local/S3/Cloudinary)
            const storageResult = await srvSaveCompanyFile(
                file.buffer, 
                'delfos-signatures', // Carpeta específica para firmas
                extension
            );

            // Preparamos los datos para guardar en el modelo
            signatureData = {
                signatureUrl: storageResult.url,
                signaturePublicId: storageResult.publicId,
                signatureStorageProvider: storageResult.provider
            };
        }

        // 4. Crear Perfil Administrativo
        await AdministrativeUser.create({
            user: newUser._id,
            password: hashPassword,

            jobTitle: jobTitle || undefined,
            
            // Esparcimos los datos de la firma (si existen),
            ...signatureData            
        });

        res.status(201).json({
            msg: "Registro exitoso. Su cuenta está 'Pendiente de Aprobación'.",
            user: newUser,
            signatureSaved: !!file // Confirmación visual de que se guardó firma
        });

    } catch (error) {
        console.error("Error en registro:", error);
        // Manejo de duplicados (E11000)
        if (error.code === 11000) {
            return res.status(400).json({ msg: "El correo o la cédula ya están registrados." });
        }
        res.status(500).json({ msg: "Error al registrarse", error: error.message });
    }
};

// =================================================================
// INICIAR SESIÓN (Log In) - CON FILTRO DE ROLES
// =================================================================
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. BUSCAR USUARIO POR EMAIL
        // Si no existe, aquí muere el proceso (404).
        const userFound = await User.findOne({ email });

        if (!userFound) {
            return res.status(404).json({ msg: "Usuario no encontrado." });
        }

        // 2. FILTRO DE SEGURIDAD (LISTA VIP) 🛡️
        // Aquí es donde un 'clientManager' o 'operational' existente será detenido.
        const allowedRoles = ['root', 'superadmin', 'admin', 'auditor'];
        const pendingRoles = ['registered'];

        if (pendingRoles.includes(userFound.role)) {
            return res.status(403).json({
                msg: "Acceso denegado. Su rol está pendiente de aprobación."
            });
        }
        if (!allowedRoles.includes(userFound.role)) {
            return res.status(403).json({
                msg: "Acceso denegado. Su rol no tiene permisos para iniciar sesión en este sistema."
            });
        }

        // 3. VALIDAR PASSWORD (Solo si pasó el filtro anterior)
        // Buscamos el perfil administrativo donde vive la contraseña
        const adminProfile = await AdministrativeUser.findOne({ user: userFound._id });

        if (!adminProfile) {
            // Esto sería un error grave de datos (Usuario admin sin contraseña asociada)
            return res.status(500).json({ msg: "Error de integridad: Usuario sin credenciales configuradas." });
        }

        // Usamos tu helper para verificar la contraseña
        const isMatch = await verifyEncryptedPassword(password, adminProfile.password);

        if (!isMatch) {
            return res.status(401).json({ msg: "Credenciales incorrectas." }); // 401 es mejor para password mal
        }

        // 4. VERIFICAR ESTADO ACTIVO (Opcional pero recomendado)
        if (userFound.status !== 'active') {
            return res.status(403).json({ msg: "Su cuenta está inactiva o pendiente de aprobación." });
        }

        // 5. GENERAR TOKEN
        const payload = {
            id: userFound._id,
            name: userFound.names,
            email: userFound.email,
            role: userFound.role
        };
        const token = generateToken(payload);

        // 6. RESPUESTA
        res.json({ token, user: payload });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error en el servidor al iniciar sesión." });
    }
};

// =================================================================
// RENOVAR TOKEN
// =================================================================
const renewToken = async (req, res) => {
    const payload = req.payload;

    const token = generateToken({
        id: payload.id,
        name: payload.name,
        email: payload.email,
        role: payload.role
    });

    res.json({ token, user: payload });
};

// =================================================================
// ACTUALIZAR FIRMA (PUT) ✍️
// =================================================================
const updateSignature = async (req, res) => {
    try {
        // CORRECCIÓN: Usamos req.payload en lugar de req.user
        const currentUser = req.payload || req.user; 
        
        if (!currentUser || !currentUser.id) {
            throw new Error("No se identificó el usuario (Token inválido o falta middleware).");
        }

        const userId = currentUser.id;
        const file = req.file;

        if (!file) return res.status(400).json({ msg: "No se ha subido ningún archivo." });

        // 1. Buscar perfil actual
        const adminProfile = await AdministrativeUser.findOne({ user: userId });
        if (!adminProfile) return res.status(404).json({ msg: "Perfil administrativo no encontrado." });

        // 2. 🗑️ LIMPIEZA: Si ya tenía firma, la borramos del storage
        if (adminProfile.signaturePublicId) {
            await srvDeleteCompanyFile(
                adminProfile.signaturePublicId,
                adminProfile.signatureStorageProvider,
                'delfos-signatures'
            );
        }

        // 3. Guardar la NUEVA imagen
        const extension = file.mimetype.split('/')[1] || 'png';
        const storageResult = await srvSaveCompanyFile(
            file.buffer,
            'delfos-signatures',
            extension
        );

        // 4. Actualizar BD
        const updatedAdmin = await AdministrativeUser.findOneAndUpdate(
            { user: userId },
            { 
                signatureUrl: storageResult.url,
                signaturePublicId: storageResult.publicId,
                signatureStorageProvider: storageResult.provider
            },
            { new: true }
        );

        res.json({
            msg: "Firma actualizada correctamente.",
            signatureUrl: updatedAdmin.signatureUrl
        });

    } catch (error) {
        console.error("🔴 Error actualizando firma:", error);
        res.status(500).json({ msg: "Error al actualizar la firma.", detail: error.message });
    }
};

// =================================================================
// ELIMINAR FIRMA (DELETE) ❌
// =================================================================
const removeSignature = async (req, res) => {
    try {
        // CORRECCIÓN: Usamos req.payload
        const currentUser = req.payload || req.user;

        if (!currentUser || !currentUser.id) {
            throw new Error("No se identificó el usuario.");
        }

        const userId = currentUser.id;

        // 1. Buscar perfil
        const adminProfile = await AdministrativeUser.findOne({ user: userId });
        if (!adminProfile) return res.status(404).json({ msg: "Perfil administrativo no encontrado." });

        // 2. 🗑️ LIMPIEZA: Si tiene firma física, la borramos
        if (adminProfile.signaturePublicId) {
            await srvDeleteCompanyFile(
                adminProfile.signaturePublicId,
                adminProfile.signatureStorageProvider,
                'delfos-signatures'
            );
        }

        // 3. Actualizar BD a null
        await AdministrativeUser.findOneAndUpdate(
            { user: userId },
            { 
                signatureUrl: null,
                signaturePublicId: null,
                signatureStorageProvider: null 
            }
        );

        res.json({ msg: "Firma eliminada. Se usará el espacio manual." });

    } catch (error) {
        console.error("🔴 Error eliminando firma:", error);
        res.status(500).json({ msg: "Error al eliminar la firma.", detail: error.message });
    }
};

export {
    register,
    loginUser,
    renewToken,
    updateSignature,
    removeSignature
};