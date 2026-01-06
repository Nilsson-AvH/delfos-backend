import mongoose from 'mongoose';

const Schema = mongoose.Schema;

/**
 * CompanyDocument Model (Documentos Oficiales Generados)
 * * Almacena la referencia a los PDFs creados por el sistema (Contratos, Certificados, etc).
 * * Diferente a 'Documents', estos son inmutables por el usuario.
 */
const CompanyDocumentSchema = new Schema({

    // 1. Vinculación
    // ----------------------------------------------------------------
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // 2. Clasificación Interna
    // ----------------------------------------------------------------
    documentType: {
        type: String,
        enum: [
            'ContratoLaboral',
            'CertificadoLaboral',
            'CartaPresentacion',
            'PazYSalvo',
            'LiquidacionCesantias',
            'ExamenEgreso',
            'CarnetCorporativo'
        ],
        required: true
    },

    // 3. Referencia al Archivo (Cloudinary)
    // ----------------------------------------------------------------
    fileUrl: {
        type: String,
        required: true // Aquí va el PDF resultante
    },
    publicId: {
        type: String, // Para poder borrarlo o actualizarlo en la nube
        required: true
    },

    // 4. Rastro de Datos (Audit Trail)
    // ----------------------------------------------------------------
    // Opcional: Guardamos qué ID de contrato generó esto, o a qué cliente iba dirigido
    referenceId: {
        type: Schema.Types.ObjectId,
        // Puede referenciar a un Contract, a un Client, etc. Es dinámico.
        required: false
    },

    generatedBy: { // Quién ordenó la creación (Admin ID)
        type: Schema.Types.ObjectId,
        ref: 'User'
    }

}, {
    timestamps: true,
    versionKey: false
});

const CompanyDocument = mongoose.model('CompanyDocument', CompanyDocumentSchema);

export default CompanyDocument;