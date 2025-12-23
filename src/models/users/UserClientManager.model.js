import mongoose from "mongoose";

const Schema = mongoose.Schema;

/**
 * Client Manager User Model (Gestor de Cliente)
 * * Este esquema representa al HUMANO encargado de administrar una empresa (Cliente).
 * * Refactor: Campos actualizados a Inglés.
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
    birthDate: { // Antes: fechaNacimiento
        type: Date,
        required: true
    },
    birthPlace: { // Antes: lugarNacimiento
        type: String,
        required: true,
        trim: true
    },
    issueDate: { // Antes: fechaExpedicion (Fecha de expedición del documento)
        type: Date,
        required: true
    },
    issuePlace: { // Antes: lugarExpedicion
        type: String,
        required: true,
        trim: true
    },
    nationality: { // Antes: nacionalidad
        type: String,
        required: true,
        trim: true
    },

    // 3. Datos de Contacto y Ubicación
    // ----------------------------------------------------------------
    phones: [{ // Antes: celulares
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