import mongoose from 'mongoose';
import userModel from './User.model.js';
import { ParafiscalesSchema } from './Parafiscales.model.js';

const AdministrativeUserSchema = new mongoose.Schema({
    password: {
        type: String,
        required: true
    }
});

// Add fields from UserParafiscalesSchema (Inherit parafiscales data)
AdministrativeUserSchema.add(ParafiscalesSchema);

const AdministrativeUser = userModel.discriminator('AdministrativeUser', AdministrativeUserSchema);

export default AdministrativeUser;
