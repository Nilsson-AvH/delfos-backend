import mongoose from 'mongoose';

const Schema = mongoose.Schema;

/**
 * Operational User Model (El Empleado / Operario)
 * * Versión con MEMORIA HISTÓRICA.
 * * Maneja estado actual (para consultas rápidas) y logs históricos (para auditoría).
 * * Soporta rotación de puestos, renovación de contratos y cambios de seguridad social.
 */
const OperationalUserSchema = new Schema({

    // 1. Vinculación de Identidad (Inmutable)
    // ----------------------------------------------------------------
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },


    // 2. Historial Laboral: UBICACIÓN (Cliente)
    // ----------------------------------------------------------------
    // Dónde está HOY (Acceso rápido para el dashboard)
    clienteActual: {
        type: Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    // Dónde estuvo ANTES (Trazabilidad de rotación)
    historialClientes: [{
        cliente: {
            type: Schema.Types.ObjectId,
            ref: 'Client',
            required: true
        },
        fechaInicio: { type: Date, required: true },
        fechaFin: { type: Date, required: true }, // Cuándo lo movieron
        motivoCambio: { type: String } // Ej: "Rotación", "Solicitud Cliente", "Castigo"
    }],


    // 3. Historial Laboral: CONTRATOS (Renovaciones)
    // ----------------------------------------------------------------
    // Contrato VIGENTE (Para nómina actual)
    contractActual: {
        type: Schema.Types.ObjectId,
        ref: 'Contract',
        required: true
    },
    // Contratos ANTERIORES (Archivo muerto)
    historialContratos: [{
        contract: {
            type: Schema.Types.ObjectId,
            ref: 'Contract', // Referencia al documento de contrato viejo
            required: true
        },
        observaciones: String // Ej: "Terminado por tiempo cumplido"
    }],


    // 4. Historial Laboral: SEGURIDAD SOCIAL (Parafiscales)
    // ----------------------------------------------------------------
    // Afiliaciones VIGENTES
    parafiscalesActuales: {
        type: Schema.Types.ObjectId,
        ref: 'Parafiscales',
        required: true
    },
    // Afiliaciones PASADAS (Si se cambió de EPS o Fondo)
    historialParafiscales: [{
        parafiscales: {
            type: Schema.Types.ObjectId,
            ref: 'Parafiscales',
            required: true
        },
        fechaCambio: { type: Date, default: Date.now },
        motivoCambio: { type: String } // Ej: "Traslado voluntario de EPS"
    }],


    // 5. DOCUMENTACIÓN (Cursos, Diplomas, Soportes)
    // ----------------------------------------------------------------
    // Aquí van TODOS (Viejos y nuevos). 
    // La lógica de "Vencimiento" se hace filtrando por el campo 'expiryDate' 
    // que ya existe dentro del modelo Document.
    documents: [{
        type: Schema.Types.ObjectId,
        ref: 'Document'
    }],


    // 6. Registro de Tiempos (Ingresos y Retiros de la Empresa)
    // ----------------------------------------------------------------
    // Esto es para saber si el empleado se fue de la empresa y volvió a los 2 años.
    vinculacionesEmpresa: [{
        fechaIngreso: { type: Date, required: true },
        fechaRetiro: { type: Date, required: false }, // Null si está activo
        motivoRetiro: { type: String }
    }],


    // 7. Datos Personales y Demográficos (Generalmente estáticos o editables directamente)
    // ----------------------------------------------------------------
    fechaNacimiento: { type: Date, required: true },
    lugarNacimiento: { type: String, required: true, trim: true },
    fechaExpedicion: { type: Date, required: true },
    lugarExpedicion: { type: String, required: true, trim: true },
    nacionalidad: { type: String, required: true, trim: true },
    sexo: { type: String, enum: ['Mujer', 'Hombre'], required: true },
    estadoCivil: {
        type: String,
        enum: ['Soltero', 'Casado', 'Union Libre', 'Divorciado', 'Viudo'],
        required: true
    },

    // Físicos
    estatura: { type: Number, required: true },
    peso: { type: Number, required: true },
    foto: {
        type: String,
        required: false,
        default: 'https://cdn-icons-png.flaticon.com/128/3135/3135715.png'
    },

    // Residencia y Contacto
    direccionResidencia: { type: String, required: true, trim: true },
    barrioResidencia: { type: String, required: true, trim: true },
    tipoResidencia: {
        type: String,
        enum: ['Propia', 'Familiar', 'Arriendo', 'Otra'],
        required: true
    },
    celulares: [{ type: String, required: true, trim: true }],

    // Acudiente
    acudiente: { type: String, required: true, trim: true },
    acudienteTelefono: { type: String, required: true, trim: true },
    acudienteParentesco: { type: String, required: true, trim: true },

    // Información Adicional
    tieneVehiculo: { type: Boolean, required: true },
    tipoVehiculo: { type: String, enum: ['Vehiculo', 'Moto', 'Bicicleta', 'Ninguno'], required: false },
    licenciaConduccion: { type: Boolean, required: true },
    categoriaLicencia: { type: String, enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'N/A'], required: false },

    // Grupo Familiar
    grupoFamiliar: [{
        nombre: { type: String, required: true },
        nuip: { type: String, required: true },
        parentesco: { type: String, enum: ['Conyuge', 'Hijo', 'Hija', 'Padre', 'Madre', 'Hermano', 'Hermana'], required: true },
        actividad: { type: String, required: true },
        fechaNacimiento: { type: Date, required: true },
        dependeEconomicamente: { type: Boolean, required: true },
        beneficiarioSalud: { type: Boolean, required: true },
        discapacidad: { type: Boolean, required: true }
    }],

    // Académico
    infoAcademica: [{
        tipo: { type: String, required: true },
        institucion: { type: String, required: true },
        ciudad: { type: String, required: true },
        titulo: { type: String, required: true },
        fechaInicio: { type: Date, required: true },
        fechaFin: { type: Date, required: true },
        culmino: { type: Boolean, required: true }
    }],

    // Idiomas
    idioma: [{
        idioma: { type: String, required: true },
        institucion: { type: String, required: true },
        habla: { type: Boolean, default: false },
        lee: { type: Boolean, default: false },
        escribe: { type: Boolean, default: false }
    }]

}, {
    timestamps: true,
    versionKey: false
});

const OperationalUser = mongoose.model('OperationalUser', OperationalUserSchema);

export default OperationalUser;