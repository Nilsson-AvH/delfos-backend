import mongoose from 'mongoose';

const Schema = mongoose.Schema;

/**
 * User Model (Identidad Principal)
 * * Este esquema representa al HUMANO en el sistema (La identidad base).
 * No contiene contraseñas ni datos laborales específicos, solo la información
 * inmutable de la persona. Los perfiles (Admin, Operativo, Manager) 
 * apuntarán a este ID.
 */
const UserSchema = new Schema({

    // 1. Identificación Personal
    // ----------------------------------------------------------------
    nuip: {
        type: String,
        required: true,
        unique: true, // La cédula de ciudadanía es el identificador único principal
        trim: true
    },
    names: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    secondLastName: {
        type: String,
        required: false, // Campo opcional
        trim: true
    },

    // 2. Datos de Sistema y Contacto
    // ----------------------------------------------------------------
    email: {
        type: String,
        required: true,
        unique: true, // El correo también funciona como llave única de acceso
        lowercase: true,
        trim: true,
        match: [/.+@.+\..+/, "Por favor, ingrese un correo válido"]
    },

    // Nota: El Password no se guarda aquí. Se gestiona en los perfiles 
    // que requieren login (ej: AdministrativeUser).

    role: {
        type: String,
        required: true,
        default: "registered",
        // Definición estricta de roles permitidos en el sistema
        enum: [
            'root',         // Dios (Devs) Permisos totales: Aprobar Usuarios, post, get, patch, delete
            'superadmin',   // Gerente Empresa Permisos: Aprobar Usuarios, post, get, patch 
            'admin',        // Admin general Permisos: post, get, patch
            'auditor',      // Auditor Permisos: get
            'registered',   // El "Limbo" (Recién registrado esperando aprobación) Permisos: none
            'client',       // Cliente Permisos: none
            'operational',  // Operativo Permisos: none
            'clientManager' // Admin de cliente Permisos: none
        ]
    },

    requestedRole: {
        type: String,
        required: false // Es opcional (un operativo creado a mano no pide nada)
    },

    status: {
        type: String,
        required: true,
        enum: ['active', 'inactive', 'suspended'],
        default: 'inactive' // Por defecto nacen inactivos si es registro público
    },

    // 👇👇👇 CAMPOS DE FOTO (MIGRADO DE OPERATIONAL) 👇👇👇
    photo: {
        type: String,
        required: false,
        default: 'https://cdn-icons-png.flaticon.com/128/3135/3135715.png' // Avatar por defecto
    },
    
    // Metadatos para poder borrar la foto antigua del Storage Híbrido
    photoPublicId: { 
        type: String, 
        select: false
    }, // Oculto por defecto

    photoStorageProvider: { 
        type: String, 
        enum: ['local', 'cloudinary', 's3'], 
        default: 'local' 
    }
    // 👆👆👆 ---------------------------------------------------- 👆👆👆

}, {
    timestamps: true, // Gestiona automáticamente createdAt y updatedAt
    versionKey: false, // Evita que Mongoose cree el campo __v
    // AQUÍ ACTIVAMOS LOS VIRTUALS
    // Esto hace que aparezcan cuando haces un res.json(user)
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ----------------------------------------------------------------
// VIRTUALS (Campos calculados para externos)
// ----------------------------------------------------------------

// 1. Primer Nombre (Para correos tipo "Hola Juan")
UserSchema.virtual('firstName').get(function() {
    if (!this.names) return '';
    return this.names.split(' ')[0];
});

// 2. Segundo Nombre (El resto del string names)
UserSchema.virtual('middleName').get(function() {
    if (!this.names) return '';
    const partes = this.names.trim().split(/\s+/); // Split por cualquier espacio
    // Si solo tiene un nombre (ej: "Andres"), esto devuelve string vacío
    return partes.slice(1).join(' ');
});

// 3. Nombre Completo Real (Concatenación total)
// Útil para buscadores o títulos de perfil sin tener que sumar strings en el front
UserSchema.virtual('fullName').get(function() {
    // Usamos filter(Boolean) para que si secondLastName no existe, no deje un espacio doble
    return [this.names, this.lastName, this.secondLastName].filter(Boolean).join(' ');
});

const userModel = mongoose.model('User', UserSchema);

export default userModel;