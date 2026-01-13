// =====================================================================
// SYSTEM COMPANY SERVICE
// =====================================================================
import SystemCompany from '../../models/system/SystemCompany.model.js';

// 1. Obtener la configuración (Singleton)
const dbGetCompanyConfig = async () => {
    return await SystemCompany.findOne();
};

// 2. Crear configuración (Solo se usa la primera vez)
const dbCreateCompanyConfig = async (data) => {
    return await SystemCompany.create(data);
};

// 3. Contar configuraciones (Para validar que solo exista 1)
const dbCountCompanyConfig = async () => {
    return await SystemCompany.countDocuments();
};

// 4. Actualizar configuración
const dbUpdateCompanyConfig = async (id, data) => {
    return await SystemCompany.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
    );
};

export {
    dbGetCompanyConfig,
    dbCreateCompanyConfig,
    dbCountCompanyConfig,
    dbUpdateCompanyConfig
};