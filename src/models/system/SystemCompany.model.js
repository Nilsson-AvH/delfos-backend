import mongoose from 'mongoose';

const Schema = mongoose.Schema;

/**
 * SystemCompany Model (Configuración del Tenant / Dueño del Software)
 * * Singleton: Solo debe existir 1 documento de estos en toda la colección.
 */
const SystemCompanySchema = new Schema({

    // 1. Identidad Corporativa (Colombianizada 🇨🇴)
    // ----------------------------------------------------------------
    companyName: { 
        type: String, 
        required: [true, "El nombre de la empresa es obligatorio"], 
        trim: true,
        uppercase: true 
    },
    nit: { 
        type: String, 
        required: [true, "El NIT es obligatorio"], 
        trim: true 
    },
    
    // Ubicación Geográfica
    department: { 
        type: String, 
        required: [true, "El departamento es obligatorio"], // Ej: Cundinamarca
        trim: true 
    },
    city: { 
        type: String, 
        required: [true, "La ciudad/municipio es obligatoria"], // Ej: Sopó
        trim: true 
    },
    address: { 
        type: String, 
        required: [true, "La dirección es obligatoria"], 
        trim: true 
    },
    
    phones: [{ type: String }],
    email: { type: String, lowercase: true, trim: true },
    website: { type: String, trim: true },

    // Representante Legal (Para firmas automáticas)
    legalRepresentative: {
        name: { type: String, required: true, uppercase: true },
        role: { type: String, default: 'GERENTE GENERAL', uppercase: true }
    },

    // 2. Branding (Logos y Firmas en Almacenamiento)
    // ----------------------------------------------------------------
    
    // 1. Logo Principal (Documentos varios)
    logoUrl: { type: String },
    logoPublicId: { type: String, select: false },
    logoProvider: { type: String, default: 'local', select: false },

    // 2. Interface CRM (Header)
    logoHeaderUrl: { type: String },
    logoHeaderPublicId: { type: String, select: false },
    logoHeaderProvider: { type: String, default: 'local', select: false },

    // 3. Interface CRM (Footer)
    logoFooterUrl: { type: String },
    logoFooterPublicId: { type: String, select: false },
    logoFooterProvider: { type: String, default: 'local', select: false },

    // 4. Marca de Agua (Contratos)
    watermarkUrl: { type: String },
    watermarkPublicId: { type: String, select: false },
    watermarkProvider: { type: String, default: 'local', select: false },

    // 5. Carnet Corporativo (Frente)
    employeeFrontCardUrl: { type: String },
    employeeFrontCardPublicId: { type: String, select: false },
    employeeFrontCardProvider: { type: String, default: 'local', select: false },

    // 6. Carnet Corporativo (Reverso)
    employeeBackCardUrl: { type: String },
    employeeBackCardPublicId: { type: String, select: false },
    employeeBackCardProvider: { type: String, default: 'local', select: false },

    // 7. Código QR (Empresarial)
    qrCodeUrl: { type: String },
    qrCodePublicId: { type: String, select: false },
    qrCodeProvider: { type: String, default: 'local', select: false },

    // 8. Membrete / Fondo de Carta
    letterHeadUrl: { type: String },
    letterHeadPublicId: { type: String, select: false },
    letterHeadProvider: { type: String, default: 'local', select: false },

    // 9. Firma Representante Legal
    signatureUrl: { type: String },
    signaturePublicId: { type: String, select: false },
    signatureProvider: { type: String, default: 'local', select: false },

    // ================================================================
    // 💾 MÓDULO DE STORAGE (SaaS)
    // ================================================================
    storageProvider: {
        type: String,
        enum: ['local', 'cloudinary', 's3'], 
        default: 'local'
    },

    // CONFIGURACIÓN LOCAL (URL base para armar links)
    backendUrl: { 
        type: String, 
        default: 'http://localhost:3000' 
    },

    // CONFIGURACIÓN S3 (Compatible con AWS, MinIO, DigitalOcean)
    s3Config: {
        endpoint: { type: String },       // MinIO requiere esto. AWS no.
        bucketName: { type: String },     
        region: { type: String, default: 'us-east-1' }, 
        accessKeyId: { type: String, select: false },     // Protegido
        secretAccessKey: { type: String, select: false }  // Protegido
    },

    // ================================================================

    // 3. CONTROL DE SUSCRIPCIÓN (SaaS Mode) 🛑
    // ----------------------------------------------------------------
    // Estos campos deberían ser "ReadOnly" para el usuario normal, 
    // solo editables por ti (Root) vía base de datos o endpoint especial.
    licenseKey: { type: String, select: false }, 
    
    subscriptionStatus: { 
        type: String, 
        enum: ['active', 'suspended', 'grace_period', 'pending_approval'], // <--- Estado de la suscripción
        default: 'pending_approval' // <--- Inactiva por seguridad pero en demo_trial se activa automáticamente
    },

    // 👇👇👇 ¡PLAN DEL CLIENTE! 👇👇👇
    planType: {
        type: String,
        enum: ['demo_trial', 'basic', 'pro', 'enterprise'], // Lista de planes válidos
        default: 'demo_trial'
    },
    // 👆👆👆 ----------------------------- 👆👆👆
    
    validUntil: { 
        type: Date, 
        required: true,
        // Por defecto: 30 días desde hoy para demo_trial y enamorar al cliente
        default: Date.now 
    },

    // 👇👇👇 EL CONTROL DE SEDES 👇👇👇
    
    // LIMITADORES DEL PLAN (Lo que le vendes al cliente)
    maxBranchesAllowed: { 
        type: Number, 
        default: 1, // Plan Demo/Básico: Solo 1 sede (la principal)
        required: true  
    },
    
    maxUsersAllowed: { 
        type: Number, 
        default: 5, // Plan Demo/Básico: 5 usuarios
        required: true
    }

}, {
    timestamps: true,
    versionKey: false
});

const SystemCompany = mongoose.model('SystemCompany', SystemCompanySchema);

export default SystemCompany;