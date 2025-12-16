import mongoose from 'mongoose';

const Schema = mongoose.Schema;

/**
 * Parafiscales Model (Seguridad Social)
 * * Almacena la afiliación a entidades de seguridad social.
 * * Se separa del usuario para mantener la información laboral organizada.
 */
const ParafiscalesSchema = new Schema({

    // 1. Riesgos Laborales (ARL)
    // ----------------------------------------------------------------
    arl: {
        type: String,
        required: true,
        trim: true
    },
    arldate: {
        type: Date,
        required: false,
        default: null, // Mejor null que 1970 para evitar errores visuales
        trim: true
    },
    arlRisk: {
        type: String,
        required: true,
        enum: ['R1', 'R2', 'R3', 'R4', 'R5'], // Agregué R1 y R2 por si acaso, o déjalo como tenías
        trim: true
    },

    // 2. Salud (EPS)
    // ----------------------------------------------------------------
    eps: {
        type: String,
        required: true,
        trim: true
    },
    epsDate: {
        type: Date,
        required: false,
        default: null,
        trim: true
    },

    // 3. Compensación y Pensiones
    // ----------------------------------------------------------------
    compensationFund: { // Caja de Compensación
        type: String,
        required: true,
        trim: true
    },
    compensationDate: {
        type: Date,
        required: false,
        default: null,
        trim: true
    },
    pensionsAndSeverance: { // Fondo de Pensiones
        type: String,
        required: true,
        trim: true
    },
    pensionsDate: {
        type: Date,
        required: false,
        default: null,
        trim: true
    },
    cesantias: { // Fondo de Cesantías (a veces es el mismo de pensiones, a veces no)
        type: String,
        required: true,
        trim: true
    },
    cesantiasDate: {
        type: Date,
        required: false,
        default: null,
        trim: true
    },

    // 4. Seguros Adicionales
    // ----------------------------------------------------------------
    seguroVida: {
        type: String,
        required: true,
        trim: true
    },
    seguroVidaDate: {
        type: Date,
        required: false,
        default: null,
        trim: true
    }

}, {
    timestamps: true,
    versionKey: false
});

const ParafiscalesModel = mongoose.model('Parafiscales', ParafiscalesSchema);

export default ParafiscalesModel;