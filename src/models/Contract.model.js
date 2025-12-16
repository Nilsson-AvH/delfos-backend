import mongoose from 'mongoose';

const Schema = mongoose.Schema;

/**
 * Contract Model (Acuerdo Laboral - Data)
 * * Este esquema almacena la INFORMACIÓN VIVA del contrato (sueldos, fechas).
 * * NO guarda el archivo PDF (eso va en Document.model.js).
 * * Se relaciona directamente con UserOperational.
 */
const ContractSchema = new Schema({

    // 1. Datos Económicos y Legales
    // ----------------------------------------------------------------
    contractContent: {
        type: String, // Puede ser texto plano, HTML o ID de plantilla
        required: [true, 'El contenido contractual es obligatorio.'],
        default: ''
    },
    contractValue: {
        type: Number,
        required: [true, 'El valor del contrato es obligatorio.'],
        min: 0
    },
    contractTermMonths: {
        type: Number,
        required: [true, 'El plazo del contrato es obligatorio.'],
        min: 1
    },

    // 2. Vigencia y Estado
    // ----------------------------------------------------------------
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true,
    versionKey: false
});

const ContractModel = mongoose.model('Contract', ContractSchema);

export default ContractModel;