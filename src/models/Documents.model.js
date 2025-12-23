import { Schema, model } from "mongoose";

/**
 * Document Model (Soportes Digitales y Físicos)
 * * Versión Completa: Incluye metadatos de archivo y flujo de aprobación.
 */
const DocumentSchema = new Schema({

    // 1. Propietario
    // ----------------------------------------------------------------
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El documento debe estar asociado con un usuario.'],
        index: true
    },

    // 2. Clasificación
    // ----------------------------------------------------------------
    documentType: {
        type: String,
        enum: [
            'CursoVigilancia',
            'Curso',
            'LicenciaConduccion',
            'Cedula',
            'LibretaMilitar',
            'CertificacionLaboral',
            'CertificacionAcademica',
            'Memorando',
            'ExamenMedico',
            'Otro'
        ],
        required: [true, 'El tipo de documento es obligatorio.'],
        index: true
    },

    title: {
        type: String,
        required: [true, 'El título es obligatorio.'],
        trim: true
    },

    // 3. Archivo y Storage (MEJORADO)
    // ----------------------------------------------------------------
    fileUrl: {
        type: String,
        required: [true, 'La URL del archivo es obligatoria.'],
        trim: true
    },

    // [NUEVO] ID del archivo en la nube (Cloudinary/AWS) para poder borrarlo luego
    publicId: {
        type: String,
        required: false,
        trim: true
    },

    // [NUEVO] Formato del archivo (pdf, jpg, png) para iconos en el Frontend
    mimeType: {
        type: String,
        required: false,
        trim: true
    },

    // [NUEVO] Peso en bytes (para estadísticas)
    size: {
        type: Number,
        required: false
    },

    // 4. Estado y Aprobación (NUEVO - WORKFLOW)
    // ----------------------------------------------------------------
    status: {
        type: String,
        enum: ['Pendiente', 'Aprobado', 'Rechazado'],
        default: 'Pendiente',
        index: true
    },

    rejectionReason: { // Solo si status === 'Rechazado'
        type: String,
        trim: true
    },

    // 5. Codigo ECSP (Curso Vigilancia)
    // ----------------------------------------------------------------
    verificationCode: {
        type: String,
        trim: true,
        uppercase: true,
        maxlength: 10
    },

    issueDate: { type: Date },

    expiryDate: { type: Date, index: true },

    issuingEntity: { type: String, trim: true },

    isArchived: { type: Boolean, default: false }

}, {
    timestamps: true,
    versionKey: false
});

// =====================================================================
// VALIDACIÓN DINÁMICA DE REGLAS DE NEGOCIO (CORREGIDO)
// =====================================================================
// Usamos 'async function' sin argumentos para evitar el error de 'next is not a function'.
// En lugar de 'next(new Error)', simplemente lanzamos el error con 'throw'.
DocumentSchema.pre('save', async function () {
    const type = this.documentType;

    // REGLA 1: Documentos que vencen (Cursos, Licencias, Exámenes)
    if (['CursoVigilancia', 'LicenciaConduccion', 'ExamenMedico'].includes(type)) {
        if (!this.expiryDate) {
            throw new Error(`El documento tipo '${type}' requiere fecha de vencimiento (expiryDate).`);
        }
    }

    // REGLA 2: Validación específica para Cursos de Vigilancia
    if (type === 'CursoVigilancia') {
        if (!this.verificationCode) {
            throw new Error(`El Curso de Vigilancia requiere el código de autenticidad (verificationCode).`);
        }

        // Opcional
        /* if (!this.issuingEntity) {
             throw new Error(`Debe especificar la Academia que expidió el curso.`);
        } */
    }

    // Si todo está bien, la función termina y Mongoose guarda automáticamente.
});

const DocumentModel = model('Document', DocumentSchema);

export default DocumentModel;