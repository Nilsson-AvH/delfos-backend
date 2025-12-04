import mongoose from 'mongoose';

const Schema = mongoose.Schema;
// ... (mismo archivo o importa User)

// Define el esquema discriminador para UserInformation
// Este extiende al esquema User y añade las nuevas propiedades
const UserInformationSchema = new Schema({
    // Propiedades específicas de seguridad social / Información laboral
    arl: {
        type: String,
        required: true,
        trim: true
    },
    eps: {
        type: String,
        required: true,
        trim: true
    },
    compensationFund: { // Caja de Compensación
        type: String,
        required: true,
        trim: true
    },
    pensionsAndSeverance: { // Pensiones y Cesantías
        type: String,
        required: true,
        trim: true
    }
});

// Crea el modelo discriminador.
// El primer argumento es la clave que identificará a este tipo de documento (e.g., 'Employee' o 'FullInfoUser').
// const userInformationModel = User.discriminator('UserInformation', UserInformationSchema);

// export default userInformationModel;

export {
    UserInformationSchema
}