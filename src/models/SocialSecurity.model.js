import mongoose from 'mongoose';

const Schema = mongoose.Schema;

/**
 * Parafiscales Model (Seguridad Social) (Social Security & Benefits)
 * * Almacena la afiliación a entidades de seguridad social.
 * * Se separa del usuario para mantener la información laboral organizada.
 */
const SocialSecuritySchema = new Schema({

    // 1. Riesgos Laborales (ARL)
    // ----------------------------------------------------------------
    arl: { type: String, required: true, trim: true },
    arlDate: { type: Date, default: null }, // camelCase
    arlRisk: { type: String, required: true, enum: ['R1', 'R2', 'R3', 'R4', 'R5'], trim: true },

    // 2. Salud (EPS)
    // ----------------------------------------------------------------
    eps: { type: String, required: true, trim: true },
    epsDate: { type: Date, default: null },

    // 3. Caja de Compensación familiar
    // ----------------------------------------------------------------
    compensationFund: { type: String, required: true, trim: true },
    compensationDate: { type: Date, default: null },

    // 4. Pensiones
    // ----------------------------------------------------------------
    pensionFund: { type: String, required: true, trim: true }, // Antes: pensiones
    pensionDate: { type: Date, default: null },

    // 5. Cesantías
    // ----------------------------------------------------------------
    severanceFund: { type: String, required: true, trim: true }, // Antes: cesantias
    severanceDate: { type: Date, default: null },

    // 6. Seguros Adicionales
    // ----------------------------------------------------------------
    lifeInsurance: { type: String, required: true, trim: true }, // Antes: seguroVida
    lifeInsuranceDate: { type: Date, default: null }

}, {
    timestamps: true,
    versionKey: false
});

const SocialSecurityModel = mongoose.model('SocialSecurity', SocialSecuritySchema);

export default SocialSecurityModel;