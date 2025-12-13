import mongoose from 'mongoose';
import userModel from './User.model.js';

const OperationalUserSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    fechaIngresos: [{
        type: Date,
        required: true
    }],
    fechaSalidas: [{
        type: Date,
        required: false
    }], // Deben estar por pares las de ingresos y salidas
    fechaNacimiento: {
        type: Date,
        required: true
    },
    lugarNacimiento: {
        type: String,
        required: true
    },
    fechaExpedicion: {
        type: Date,
        required: true
    },
    lugarExpedicion: {
        type: String,
        required: true
    },
    nacionalidad: {
        type: String,
        required: true
    },
    direccionResidencia: {
        type: String,
        required: true
    },
    tipoResidencia: {
        type: String,
        enum: [`Propia`, `Familiar`, `Arriendo`, `Otra`],
        required: true
    },
    barrioResidencia: {
        type: String,
        required: true
    },
    celulares: [{
        type: String,
        required: true
    }],
    cliente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClientUser',
        required: true
    },
    estadoCivil: {
        type: String,
        enum: [`Soltero`, `Casado`, `Union Libre`, `Divorciado`, `Viudo`],
        required: true
    },
    sexo: {
        type: String,
        enum: [`Mujer`, `Hombre`],
        required: true
    },
    grupoFamiliar: {
        type: [{
            nombre: {
                type: String,
                required: true
            },
            nuip: {
                type: String,
                required: true
            },
            parentesco: {
                type: String,
                enum: [`Conyuge`, `Hijo`, `Hija`, `Padre`, `Madre`, `Hermano`, `Hermana`],
                required: true
            },
            actividad: {
                type: String,
                enum: [`Independiente`, `Pensionado`, `Hogar`, `Estudiante`, `Empleado`, `Desempleado`],
                required: true
            },
            fechaNacimiento: {
                type: Date,
                required: true
            },
            dependeEconomicamente: {
                type: Boolean,
                required: true
            },
            beneficiarioSalud: {
                type: Boolean,
                required: true
            },
            discapacidad: {
                type: Boolean,
                required: true
            }
        }],
        required: false
    },
    parafiscales: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Parafiscales',
        required: true,
        unique: true // Asegura la relación 1:1: Un OperationalUser solo puede tener 1 Parafiscales.
    },
    tieneVehiculo: {
        type: Boolean,
        required: true
    },
    tipoVehiculo: {
        type: String,
        enum: [`Vehiculo`, `Moto`, `Bicicleta`],
        required: false
    },
    licenciaConduccion: {
        type: Boolean,
        required: true        
    },
    categoriaLicencia: {
        type: String,
        enum: [`A1`, `A2`, `B1`, `B2`, `C1`, `C2`],
        required: false
    },
    estatura: {
        type: Number,
        required: true
    },
    peso: {
        type: Number,
        required: true
    },
    acudiente: {
        type: String,
        required: true
    },
    acudienteTelefono: {
        type: String,
        required: true
    },
    acudienteParentesco: {
        type: String,
        required: true
    },
    infoAcademica: {
        type: [
            {
                tipo: {
                    type: String,
                    enum: [`Primaria`, `Secundaria`, `Tecnologo`, `Superior`, `Otros`],
                    required: true
                },
                institucion: {
                    type: String,
                    required: true
                },
                ciudad: {
                    type: String,
                    required: true
                },
                titulo: {
                    type: String,
                    required: true
                },
                fechaInicio: {
                    type: Date,
                    required: true
                },
                fechaFin: {
                    type: Date,
                    required: true
                },
                culmino: {
                    type: Boolean,
                    required: true
                }
            }
        ],
        required: false
    },
    idioma: {
        type: [
            {
                idioma: {
                    type: String,
                    required: true
                },
                institucion: {
                    type: String,
                    required: true
                },
                habla: {
                    type: Boolean,
                    required: true
                },
                lee: {
                    type: Boolean,
                    required: true
                },
                escribe: {
                    type: Boolean,
                    required: true
                }
            }
        ],
        required: false
    },
    contract: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contract',
        required: true
    },
    documents: {
        type: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Document',
                required: true
            }
        ],
        required: false
    },
    motivoRetiro: {
        type: String,
        required: true
    }
}, { 
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
    versionKey: false
});

// Operational User: Base User + Parafiscales Data. NO Password.
const OperationalUser = mongoose.model('OperationalUser', OperationalUserSchema);

export default OperationalUser;