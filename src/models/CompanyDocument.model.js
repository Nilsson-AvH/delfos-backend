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

    // 3. Referencia al Archivo (Storage)
    // ----------------------------------------------------------------
    fileUrl: {
        type: String,
        required: true // Aquí va el PDF resultante
    },
    publicId: {
        type: String, // Para poder borrarlo o actualizarlo en la nube
        required: true
    },

    storageProvider: {
        type: String,
        enum: ['local', 'cloudinary', 's3'],
        required: true,
        default: 'local'
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
    },

    // 👇👇👇 5. SEGURIDAD Y VERIFICACIÓN 👇👇👇
    
    // Huella Digital (SHA-256) para garantizar integridad
    securityHash: { 
        type: String, 
        index: true 
    }, 
    
    // Código Único de Documento (Para imprimir y validar)
    cud: { 
        type: String, 
        index: true, 
        unique: true, 
        sparse: true // Permite que documentos viejos no tengan CUD sin romper la base
    }, 
    
    // Trazabilidad extra (Opcional, pero recomendada)
    signedAtIP: { type: String }, 
    userAgent: { type: String }

    // 👆👆👆 ------------------------------------------- 👆👆👆

}, {
    timestamps: true,
    versionKey: false
});

const CompanyDocument = mongoose.model('CompanyDocument', CompanyDocumentSchema);

export default CompanyDocument;