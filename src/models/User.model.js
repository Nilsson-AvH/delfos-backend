import mongoose from 'mongoose';
import { UserInformationSchema } from './UserInformation.model.js';
const Schema = mongoose.Schema;

// Define el esquema base para User
const UserSchema = new Schema({
    // Propiedades de identificación y personales
    cc: { // Cédula de ciudadanía
        type: String,
        required: true,
        unique: true, // Asegura que la CC sea única
        trim: true
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    middleName: {
        type: String,
        required: false, // Opcional
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
    password: { // Contraseña
        type: String,
        required: true,
        // **Recomendación:** Implementar hashing (e.g., bcrypt) antes de guardar
        // Puedes usar un pre-save hook en Mongoose para esto.
    },
    username: {
        type: String,
        required: true,
        unique: true, // Asegura que el nombre de usuario sea único
        trim: true
    },
    role: {
        type: String,
        required: true,
        enum: ['admin', 'user', 'guest', 'manager'], // Define roles válidos
        default: 'user'
    },
    status: { // Estado
        type: String,
        required: true,
        enum: ['active', 'inactive', 'suspended'], // Define estados válidos
        default: 'active'
    }
}, {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
    discriminatorKey: 'userType' // Clave usada para diferenciar los discriminadores
});

// Crea el modelo base
const userModel = mongoose.model('User', UserSchema);

const userInformationModel = userModel.discriminator( 'UserInformation', UserInformationSchema );

export {
    userModel,
    userInformationModel
};