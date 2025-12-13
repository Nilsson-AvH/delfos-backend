import mongoose from 'mongoose';

const ClientUserSchema = new mongoose.Schema({
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
    },
    clientManager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClientManagerUser',
        required: true
    }
});

const ClientUser = mongoose.model('ClientUser', ClientUserSchema);

export default ClientUser;
