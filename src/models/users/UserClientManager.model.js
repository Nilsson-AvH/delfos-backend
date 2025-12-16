import mongoose from "mongoose";

const Schema = mongoose.Schema;

/**
 * Client Manager User Model (Gestor de Cliente)
 * * Este esquema representa al HUMANO encargado de administrar una empresa (Cliente).
 * Es la persona que se "loguea" para gestionar la cuenta de una compañía.
 * Contiene datos personales extendidos necesarios para la representación legal.
 */
const ClientManagerUserSchema = new Schema({

    // 1. Vinculación con la Identidad (User Base)
    // ----------------------------------------------------------------
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true, // Un usuario base solo puede ser UN manager a la vez
        index: true
    },

    // 2. Información Personal y de Identificación
    // ----------------------------------------------------------------
    fechaNacimiento: {
        type: Date,
        required: true
    },
    lugarNacimiento: {
        type: String,
        required: true,
        trim: true
    },
    fechaExpedicion: { // Fecha de expedición del documento de identidad
        type: Date,
        required: true
    },
    lugarExpedicion: {
        type: String,
        required: true,
        trim: true
    },
    nacionalidad: {
        type: String,
        required: true,
        trim: true
    },

    // 3. Datos de Contacto y Ubicación
    // ----------------------------------------------------------------
    celulares: [{
        type: String,
        required: true,
        trim: true
    }],
    address: {
        type: String,
        required: false,
        trim: true
    }

}, {
    timestamps: true, // Registra creación y actualización del perfil
    versionKey: false
});

const ClientManagerUser = mongoose.model('ClientManagerUser', ClientManagerUserSchema);

export default ClientManagerUser;