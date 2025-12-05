import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const DocumentsSchema = new Schema({
    contract: [
        {
            fecha_inicio: Date,
            fecha_final: Date,
            salario: Number,
            patch: String,
            tipo_contrato: { type: String, enum: ['Prestacion de servicios', 'Laboral', 'Termino Fijo', 'Estudiante', 'Pasante', 'Obra Labor'], default: 'Termino Fijo' },
            periodo: { type: String, enum: ['3 meses', '6 meses', '9 meses', '12 meses'], default: '12 meses' },
            estado: { type: String, enum: ['Activo', 'Prueba', 'Inactivo'], default: 'Activo' },
            required: false,
        }
    ],

    securityCourse: [
        {
            fecha_inicio: Date,
            fecha_final: Date,
            ECSP: String,
            patch: String,
            tipo_curso: { type: String, enum: ['Induccion', 'Reentrenamiento'], default: 'Induccion' },
            estado: { type: String, enum: ['Vigente', 'No Vigente'], default: 'No Vigente' },
            required: false,
        }
    ],
    nuip: {
        patch: String,
        required: true,
    },
    photo: [
        {
            fecha: Date,
            patch: String,
            required: true,
        }
    ],
    signature: {
        patch: String,
        required: false,
    },
    cv: {
        patch: String,
        required: false,
    },
    passport: {
        patch: String,
        required: false,
    },
    bank: [
        {
            fecha: Date,
            banco: String,
            numero_cuenta: String,
            tipo_cuenta: String,
            patch: String,
            required: false,
        }
    ],
});

export default DocumentsSchema;
