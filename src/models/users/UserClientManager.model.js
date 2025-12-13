import mongoose from "mongoose";

const ClientManagerUserSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
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
    celulares: [{
        type: String,
        required: true
    }],
    address: {
        type: String,
        required: false,
        trim: true
    }

});

const ClientManagerUser = mongoose.model('ClientManagerUser', ClientManagerUserSchema);

export default ClientManagerUserSchema;