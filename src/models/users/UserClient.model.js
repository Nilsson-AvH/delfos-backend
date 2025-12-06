import mongoose from 'mongoose';
import userModel from './User.model.js';

const ClientUserSchema = new mongoose.Schema({
    password: {
        type: String,
        required: true
    },
    nit: {
        type: String,
        required: true,
        trim: true
    },
    companyName: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    companyEmail: {
        type: String,
        required: false,
        trim: true,
        match: [/.+@.+\..+/, "Por favor, ingrese un correo válido"]
    }
});

const ClientUser = userModel.discriminator('ClientUser', ClientUserSchema);

export default ClientUser;
