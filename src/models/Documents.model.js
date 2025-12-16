import { Schema, model } from "mongoose";

/**
 * Document Model (Soportes Digitales y Físicos)
 * * Maneja todos los archivos adjuntos del empleado.
 * * IMPORTANTE: Para 'CursoVigilancia', este modelo actúa como historial y validador legal.
 */
const DocumentSchema = new Schema({

    // 1. Propietario del Documento
    // ----------------------------------------------------------------
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El documento debe estar asociado a un usuario.'],
        index: true
    },

    // 2. Clasificación del Documento
    // ----------------------------------------------------------------
    documentType: {
        type: String,
        enum: [
            'CursoVigilancia',    // Requiere 'codigo' y 'expiryDate'
            'Curso',
            'LicenciaConduccion', // Requiere 'expiryDate'
            'Cedula',
            'LibretaMilitar',
            'CertificacionLaboral',
            'CertificacionAcademica',
            'Memorando',
            'ExamenMedico',       // Requiere 'expiryDate'
            'Otro'
        ],
        required: [true, 'El tipo de documento es obligatorio.'],
        trim: true,
        index: true
    },

    title: {
        type: String,
        required: [true, 'El título o descripción es obligatorio.'],
        trim: true,
        maxlength: 250
    },

    // 3. Archivo y Datos de Validación
    // ----------------------------------------------------------------
    fileUrl: {
        type: String,
        required: [true, 'La URL del archivo es obligatoria.']
    },

    // NUEVO CAMPO: Código de autenticidad ECSP (Solo para cursos)
    codigo: {
        type: String,
        trim: true,
        uppercase: true, // Se guarda siempre en mayúsculas (ej: "A1B2C3D4")
        maxlength: [10, 'El código de validación no puede exceder 10 caracteres.'],
        required: false // Se vuelve true en el middleware si es CursoVigilancia
    },

    // 4. Fechas Críticas
    // ----------------------------------------------------------------
    issueDate: { // Fecha de expedición
        type: Date,
        required: false
    },

    expiryDate: { // Fecha de Vencimiento
        type: Date,
        required: false,
        index: true
    },

    // 5. Metadatos Adicionales
    // ----------------------------------------------------------------
    entidadEmisora: { // Ej: "Academia de Seguridad El Halcón"
        type: String,
        required: false,
        trim: true
    },

    isArchived: {
        type: Boolean,
        default: false
    }

}, {
    timestamps: true,
    versionKey: false
});

// =====================================================================
// VALIDACIÓN DINÁMICA DE REGLAS DE NEGOCIO
// =====================================================================
DocumentSchema.pre('save', function (next) {
    const type = this.documentType;

    // REGLA 1: Documentos que vencen (Cursos, Licencias, Exámenes)
    if (['CursoVigilancia', 'LicenciaConduccion', 'ExamenMedico'].includes(type)) {
        if (!this.expiryDate) {
            return next(new Error(`El documento tipo '${type}' requiere fecha de vencimiento (expiryDate).`));
        }
    }

    // REGLA 2: Validación específica para Cursos de Vigilancia
    if (type === 'CursoVigilancia') {
        if (!this.codigo) {
            return next(new Error(`El Curso de Vigilancia requiere el código de autenticidad (ECSP).`));
        }
        if (!this.entidadEmisora) {
            // Opcional: Recomendación para saber qué academia lo expidió
            // return next(new Error(`Debe especificar la Academia que expidió el curso.`));
        }
    }

    next();
});

const DocumentModel = model('Document', DocumentSchema);

export default DocumentModel;