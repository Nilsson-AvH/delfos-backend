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
            'root',
            'admin',
            'auditor',
            'registered',
            'client',
            'operational',
            'clientManager' // Corregido a camelCase para consistencia
        ]
    },

    status: {
        type: String,
        required: true,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    }

}, {
    timestamps: true, // Gestiona automáticamente createdAt y updatedAt
    versionKey: false // Evita que Mongoose cree el campo __v
});

const userModel = mongoose.model('User', UserSchema);

export default userModel;