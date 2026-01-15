import mongoose from 'mongoose';

const Schema = mongoose.Schema;

/**
 * Administrative User Model (Perfil de Acceso y Gestión)
 * * Este esquema representa el perfil de seguridad para usuarios que
 * tienen acceso al sistema (Admin, Root, Auditor, etc.).
 * Aquí se almacena la contraseña (hash) y se vincula con la identidad base.
 */
const AdministrativeUserSchema = new Schema({

    // 1. Vinculación con la Identidad (User Base)
    // ----------------------------------------------------------------
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true, // Un usuario base solo puede tener UN perfil administrativo
        index: true
    },

    // 2. Credenciales de Seguridad
    // ----------------------------------------------------------------
    password: {
        type: String,
        required: true
        // NOTA: La contraseña debe ser encriptada (Hashed) antes de guardarse
        // usando bcrypt o argon2 en el controlador o middleware 'pre-save'.
    },

    // 👇👇👇 NUEVOS CAMPOS PARA FIRMANTES 👇👇👇
    
    // 1. Cargo dentro de la empresa (Ej: "Coordinador de Operaciones", "Analista de RRHH")
        jobTitle: { 
        type: String, 
        trim: true,
        uppercase: true,
        default: "ADMINISTRATIVO" 
    },

    // 2. Firma Digital Personal (Imagen PNG transparente)
        signatureUrl: { type: String }, // URL de la firma
        signaturePublicId: { type: String, select: false }, // ID para borrar/actualizar la firma
        signatureStorageProvider: { type: String, default: 'local', select: false }, // Proveedor de almacenamiento

    // 👆👆👆 --------------------------------- 👆👆👆

}, {
    timestamps: true, // Registra cuándo se creó o modificó el acceso administrativo
    versionKey: false
});

const AdministrativeUser = mongoose.model('AdministrativeUser', AdministrativeUserSchema);

export default AdministrativeUser;