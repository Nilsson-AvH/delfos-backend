import { Schema, model } from "mongoose"; // Desestructuracion de Schema de mongoose

// Definicion del esquema
const userSchema = new Schema({
    name: {
        // Validaciones
        type: String,
        required: true,
        // Modificaciones
        trim: true
        // lowercase: true
    },
    username: {
        // Validaciones
        type: String,
        required: true,
        // Modificaciones
        trim: true,
        // lowercase: true,
        unique: true
    },
    email: {
        // Validaciones
        type: String,
        required: true,
        // Modificaciones
        trim: true,
        lowercase: true,
        unique: true
    },
    password: {
        // Validaciones
        type: String,
        required: true,
        // Modificaciones
        trim: true,
        minlength: 8,       //Minimo 8 caracteres
        maxlength: 12      //Maximo 12 caracteres
        // TODO: Aprender Expresiones Regulares
    },
    role: {
        // Validaciones
        type: String,       //Tipo de dato
        required: true,     //Validacion obligatoria
        // Modificaciones
        trim: true,         //Elimina los espacios en blanco
        lowercase: true,    //Convierte todo a minusculas
        default: "registered",    //Valor por defecto
        enum: ["administrator", "editor", "contributor", "viewer", "registered"]     //Enum (solo puede ser user o admin)
    },
    isActive: {
        type: Boolean,
        default: true
    }
    // code: {
    //     // Validaciones
    //     type: String,       // Codigo de verificacion cadena aleatoria
    //     // Modificaciones
    //     trim: true
    // }
}, {
    versionKey: false, // Deshabilitar la versionKey (no se muestra) "__v": 0
    timestamps: true // Agregar timestamps (createdAt y updatedAt)
});

// Crear el modelo Use Bado en el esquema userSchema
const userModel = model(
    // Nombre de la coleccion en singular "users"
    "users",
    // Esquema asociado al modelo
    userSchema
);

// Exportar el modelo userModel
export default userModel;
