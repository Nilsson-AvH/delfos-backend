import mongoose from 'mongoose';

// ==========================================================
// 1. ESQUEMA ESPECÍFICO PARA CONTRATOS
//    Esta es la colección de datos editable que solicitaste.
// ==========================================================
const ContractSchema = new mongoose.Schema({
    // Referencia de vuelta al registro de documento genérico.
    // Esto garantiza que cada contrato editable tiene un registro en la tabla general.
    document: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        required: true,
        unique: true // Asegura la relación 1:1: Un Document solo puede tener 1 Contract.
    },

    // --------------------------------------------------------
    // Campos específicos y editables del Contrato
    // --------------------------------------------------------

    // Contenido del contrato (la data editable, puede ser texto, JSON, o Markdown)
    contractContent: {
        type: String,
        required: [true, 'El contenido contractual es obligatorio.'],
        default: ''
    },

    // Valor del contrato
    contractValue: {
        type: Number,
        required: [true, 'El valor del contrato es obligatorio.'],
        min: 0
    },

    // Tiempo por el cual se contrata (ejemplo: en meses)
    contractTermMonths: {
        type: Number,
        required: [true, 'El plazo del contrato es obligatorio.'],
        min: 1
    },

    // Podrías añadir aquí otros campos únicos para Contratos (ej: 'firmas', 'cláusulas', etc.)

}, {
    timestamps: true // Para rastrear cuándo fue creado y editado el contenido
});

const Contract = mongoose.model('Contract', ContractSchema);

export default Contract; // (Si lo exportas en un archivo separado)