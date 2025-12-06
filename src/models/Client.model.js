import mongoose from "mongoose";
const Schema = mongoose.Schema;

const ClientSchema = new Schema({
    nit: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
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
    email: {
        type: String,
        required: false,
        trim: true
    },
    status: {
        type: String,
        required: true,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    manager: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    versionKey: false
});

const clientModel = mongoose.model('Client', ClientSchema);

export default clientModel;