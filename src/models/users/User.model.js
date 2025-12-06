import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// Define el esquema base para User
const UserSchema = new Schema({
    // Propiedades de identificación y personales
    nuip: { // Cédula de ciudadanía
        type: String,
        required: true,
        unique: true, // Asegura que la CC sea única
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
        required: false, // Opcional
        trim: true
    },

    // Propiedades de autenticación y sistema
    email: {
        type: String,
        required: true,
        unique: true, // Asegura que el correo sea único
        lowercase: true,
        trim: true,
        match: [/.+@.+\..+/, "Por favor, ingrese un correo válido"] // Validación de formato básico
    },
    // Password removido de la clase base. Se agrega en los discriminadores específicos.
    role: {
        type: String,
        required: true,
        default: "registered",
        enum: ['root', 'admin', 'auditor', 'registered'] // Define roles válidos        
    },
    status: { // Estado
        type: String,
        required: true,
        enum: ['active', 'inactive', 'suspended'], // Define estados válidos
        default: 'active'
    }
}, {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
    discriminatorKey: 'userType', // Clave usada para diferenciar los discriminadores
    versionKey: false
});

// Crea el modelo base
const userModel = mongoose.model('User', UserSchema);

export default userModel;