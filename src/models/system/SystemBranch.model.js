import mongoose from 'mongoose';

const Schema = mongoose.Schema;

/**
 * SystemBranch Model (Sucursales/Sedes)
 * * Representa oficinas adicionales (Ej: Sede Norte, Agencia Medellín).
 */
const SystemBranchSchema = new Schema({

    name: { 
        type: String, 
        required: [true, "El nombre de la sede es obligatorio"], 
        trim: true,
        uppercase: true 
    }, // Ej: "SEDE PRINCIPAL", "SUCURSAL CALI"

    // Ubicación (Colombianizada 🇨🇴)
    department: { type: String, required: true },
    city: { type: String, required: true },
    address: { type: String, required: true },
    
    phones: [{ type: String }],
    email: { type: String },

    // Contacto específico de la sede
    contactPerson: { type: String },

    isActive: { type: Boolean, default: true }

}, {
    timestamps: true,
    versionKey: false
});

const SystemBranch = mongoose.model('SystemBranch', SystemBranchSchema);

export default SystemBranch;