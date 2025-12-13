import mongoose from 'mongoose';

const AdministrativeUserSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    password: {
        type: String,
        required: true
    },
    
});

// Add fields from UserParafiscalesSchema (Inherit parafiscales data)

const AdministrativeUser = mongoose.model('AdministrativeUser', AdministrativeUserSchema);

export default AdministrativeUser;
