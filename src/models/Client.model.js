import mongoose from 'mongoose';

const Schema = mongoose.Schema;

/**
 * Client Model (Empresa / Persona Jurídica)
 * * Este esquema representa a la ENTIDAD CORPORATIVA.
 * * Mantiene un registro del manager actual y un historial de los anteriores.
 */
const ClientSchema = new Schema({

    // 1. Referencias y Relaciones (Foreign Keys)
    // ----------------------------------------------------------------

    // MANAGER ACTUAL: Acceso rápido para saber quién administra hoy.
    clientManager: {
        type: Schema.Types.ObjectId,
        ref: 'ClientManagerUser',
        required: true,
        index: true
    },

    // HISTORIAL DE MANAGERS: Auditoría de quién gestionó la empresa y cuándo.
    managersHistory: [{
        manager: {
            type: Schema.Types.ObjectId,
            ref: 'ClientManagerUser',
            required: true
        },
        startDate: {
            type: Date,
            required: true,
            default: Date.now
        },
        endDate: {
            type: Date,
            required: false, // Si es null, significa que sigue activo (o fue el último)
            default: null
        },
        reason: { // Opcional: ¿Por qué cambió? (Renuncia, Despido, Rotación)
            type: String,
            trim: true
        }
    }],

    // ¿Cómo funcionará la lógica en el Controlador?
    // ----------------------------------------------------------------
    // Para que esto funcione bien, cuando hagas el endpoint de "Cambiar Manager" (updateClientManager), deberás hacer dos cosas al tiempo:

    // Buscar en managersHistory el registro que tenga endDate: null (el actual) y ponerle la fecha de hoy como fecha de fin.

    // Actualizar el campo clientManager con el ID del nuevo manager.

    // Hacer push al array managersHistory con el nuevo manager y startDate: Date.now().

    // 2. Información Corporativa
    // ----------------------------------------------------------------
    nit: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    companyName: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    companyEmail: {
        type: String,
        required: false,
        trim: true,
        match: [/.+@.+\..+/, "Por favor, ingrese un correo válido"]
    }

}, {
    timestamps: true,
    versionKey: false
});

const ClientModel = mongoose.model('Client', ClientSchema);

export default ClientModel;