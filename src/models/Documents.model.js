import { Schema, model } from "mongoose";

const DocumentSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El documento debe estar asociado a un usuario.'],
        index: true
    },

    documentType: {
        type: String,
        enum: [
            'Contrato', // <- El tipo que activa la referencia
            'Curso',
            'Certificacion',
            'Memorando',
            'Cedula',
            'LibretaMilitar',
            'LicenciaConduccion',
            'OtroPersonal'
        ],
        required: [true, 'El tipo de documento es obligatorio.'],
        trim: true
    },

    title: {
        type: String,
        required: [true, 'El título o descripción del documento es obligatorio.'],
        trim: true,
        maxlength: 250
    },

    fileUrl: { // La URL al PDF/archivo final del contrato (si existe)
        type: String,
        required: false // Puede ser opcional si el contrato es primero data editable.
    },

    // ==========================================================
    // CAMPO CLAVE PARA LA ASOCIACIÓN
    // ==========================================================
    contractDetails: {
        type: Schema.Types.ObjectId,
        ref: 'Contract', // ¡Referencia al nuevo modelo Contract!
        required: false // Solo es obligatorio si documentType es 'Contrato'
    },

    issueDate: {
        type: Date,
        required: false
    },
    expiryDate: {
        type: Date,
        required: false
    },

}, {
    timestamps: true
});

// AÑADIR VALIDACIÓN (Middleware de Mongoose)
// Opcional pero recomendado: Asegurar que si es un 'Contrato', la referencia exista.
// DocumentSchema.pre('save', function (next) {
//     if (this.documentType === 'Contrato' && !this.contractDetails) {
//         // Si es un Contrato, contractDetails DEBE estar asociado.
//         // Esto se gestiona en la lógica de tu servicio al crear ambos documentos.
//         // next(new Error('Los documentos de tipo Contrato deben tener detalles contractuales asociados.'));
//     }
//     next();
// });

const DocumentModel = model('Document', DocumentSchema);

export default DocumentModel; // (Si lo exportas en un archivo separado)