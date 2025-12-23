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
    // ---------------------------------------------------------------
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
    currentClient: { // Antes: clienteActual
        type: Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    // Dónde estuvo ANTES (Trazabilidad de rotación)
    clientHistory: [{ // Antes: historialClientes
        client: {
            type: Schema.Types.ObjectId,
            ref: 'Client',
            required: true
        },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        changeReason: { type: String } // Antes: motivoCambio
    }],

    // 3. Historial Laboral: CONTRATOS (Renovaciones)
    // ----------------------------------------------------------------
    // Contrato VIGENTE (Para nómina actual)
    currentContract: { // Antes: contractActual
        type: Schema.Types.ObjectId,
        ref: 'Contract',
        required: true
    },
    // Contratos ANTERIORES (Archivo muerto)
    contractHistory: [{ // Antes: historialContratos
        contract: {
            type: Schema.Types.ObjectId,
            ref: 'Contract',
            required: true
        },
        observations: String
    }],

    // 4. Historial Laboral: SEGURIDAD SOCIAL (Parafiscales)
    // ----------------------------------------------------------------
    // Afiliaciones VIGENTES (Para nómina actual)
    currentSocialSecurity: { // Antes: parafiscalesActuales
        type: Schema.Types.ObjectId,
        ref: 'SocialSecurity', // Antes: Parafiscales
        required: true
    },
    // Afiliaciones ANTERIORES (Archivo muerto)
    socialSecurityHistory: [{ // Antes: historialParafiscales
        socialSecurity: {
            type: Schema.Types.ObjectId,
            ref: 'SocialSecurity', // Antes: Parafiscales
            required: true
        },
        changeDate: { type: Date, default: Date.now },
        changeReason: { type: String } // Ej: "Renovación", "Cambio de cliente", etc.
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
    employmentHistory: [{ // Antes: vinculacionesEmpresa
        entryDate: { type: Date, required: true }, // Antes: fechaIngreso
        exitDate: { type: Date, required: false }, // Antes: fechaRetiro
        exitReason: { type: String } // Antes: motivoRetiro
    }],

    // 7. Datos Personales y Demográficos (Generalmente estáticos o editables directamente)
    // ----------------------------------------------------------------
    birthDate: { type: Date, required: true }, // Antes: fechaNacimiento
    birthPlace: { type: String, required: true, trim: true },
    issueDate: { type: Date, required: true }, // Antes: fechaExpedicion (Cedula)
    issuePlace: { type: String, required: true, trim: true },
    nationality: { type: String, required: true, trim: true },

    gender: { // Sexo
        type: String,
        enum: ['Mujer', 'Hombre'], // Antes: Mujer, Hombre
        required: true
    },
    maritalStatus: { // Estado Civil
        type: String,
        enum: ['Soltero', 'Casado', 'Union Libre', 'Divorciado', 'Viudo'], // Antes: Soltero, Casado...
        required: true
    },

    // Estadísticas Físicas
    height: { type: Number, required: true }, // Antes: estatura
    weight: { type: Number, required: true }, // Antes: peso
    photo: {
        type: String,
        required: false,
        default: 'https://cdn-icons-png.flaticon.com/128/3135/3135715.png'
    },

    // Domicilio y Contacto
    address: { type: String, required: true, trim: true }, // Antes: direccionResidencia
    neighborhood: { type: String, required: true, trim: true }, // Antes: barrioResidencia
    housingType: { // Antes: tipoResidencia
        type: String,
        enum: ['Propio', 'Familiar', 'Alquilado', 'Otro'],
        required: true
    },
    phones: [{ type: String, required: true, trim: true }], // Antes: celulares

    // Contacto de emergencia
    emergencyContact: { type: String, required: true, trim: true }, // Antes: acudiente
    emergencyContactPhone: { type: String, required: true, trim: true },
    emergencyContactRelationship: { type: String, required: true, trim: true },

    // Información adicional
    hasVehicle: { type: Boolean, required: true }, // Antes: tieneVehiculo
    vehicleType: { type: String, enum: ['Carro', 'Moto', 'Bicicleta', 'Ninguno'], required: false },
    driversLicense: { type: Boolean, required: true }, // Antes: licenciaConduccion
    licenseCategory: { type: String, enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'N/A'], required: false },

    // Grupo familiar
    familyGroup: [{ // Antes: grupoFamiliar
        name: { type: String, required: true },
        nuip: { type: String, required: true },
        relationship: { type: String, enum: ['Conyuge', 'Hijo', 'Hija', 'Padre', 'Madre', 'Hermano', 'Hermana'], required: true },
        occupation: { type: String, required: true }, // Antes: actividad
        birthDate: { type: Date, required: true },
        economicDependence: { type: Boolean, required: true }, // Antes: dependeEconomicamente
        healthBeneficiary: { type: Boolean, required: true }, // Antes: beneficiarioSalud
        disability: { type: Boolean, required: true }
    }],

    // Información académica
    academicInfo: [{ // Antes: infoAcademica
        type: { type: String, required: true }, // Primaria, Bachiller, Tecnico...
        institution: { type: String, required: true },
        city: { type: String, required: true },
        degree: { type: String, required: true }, // Antes: titulo
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        completed: { type: Boolean, required: true } // Antes: culmino
    }],

    // Idiomas
    languages: [{ // Antes: idioma
        language: { type: String, required: true },
        institution: { type: String, required: true },
        speaks: { type: Boolean, default: false }, // Antes: habla
        reads: { type: Boolean, default: false }, // Antes: lee
        writes: { type: Boolean, default: false }  // Antes: escribe
    }]

}, {
    timestamps: true,
    versionKey: false
});

const OperationalUser = mongoose.model('OperationalUser', OperationalUserSchema);

export default OperationalUser;