import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const DocumentsSchema = new Schema({
    contract: [
        {
            fecha_inicio: Date,
            fecha_final: Date,
            salario: Number,
            patch: String,
            estado: { type: String, enum: ['Activo', 'Inactivo', 'Prueba'], default: 'Activo' },
            tipo_contrato: { type: String, enum: ['Prestacion de servicios', 'Laboral', 'Termino Fijo', 'Estudiante', 'Pasante', 'Obra Labor'], default: 'Termino Fijo' },
        }
    ]
    ,

    securityCourse: [
        {
            fecha_inicio: Date,
            fecha_final: Date,
            tipo_curso: { type: String, enum: ['Induccion', 'Reentrenamiento'], default: 'Induccion' },
            ECSP: String,
            patch: String,
            estado: { type: String, enum: ['Vigente', 'No Vigente'], default: 'No Vigente' },
        }
    ]
    ,
    NUIP: {
        patch: String,
        required: true,
    },
});

export default DocumentsSchema;
