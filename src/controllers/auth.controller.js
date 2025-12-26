import { encryptPassword, verifyEncryptedPassword } from "../helpers/bcrypt.helper.js"; // Usamos tus helpers
import { generateToken } from "../helpers/jwt.helper.js";
import User from "../models/users/User.model.js";
import AdministrativeUser from "../models/users/UserAdministrative.model.js"; // Ojo con el nombre del archivo, asegúrate que sea correcto en tu proyecto

// =================================================================
// REGISTRO PÚBLICO ADMINISTRATIVO
// =================================================================
const register = async (req, res) => {
    try {

        // Extraemos los datos del body
        const { nuip, names, lastName, secondLastName, email, password, roleRequest } = req.body;

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
        const hashPassword = await encryptPassword(password); // Helper asíncrono?

        // 3. Crear Perfil Administrativo
        await AdministrativeUser.create({
            user: newUser._id,
            password: hashPassword
        });

        res.status(201).json({
            msg: "Registro exitoso. Su cuenta está 'Pendiente de Aprobación'.",
            user: newUser,
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

export {
    register,
    loginUser,
    renewToken
};