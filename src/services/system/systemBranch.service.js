// =====================================================================
// SYSTEM BRANCH SERVICE
// =====================================================================
import SystemBranch from '../../models/system/SystemBranch.model.js';

// 1. Crear Sede
const dbCreateBranch = async (data) => {
    return await SystemBranch.create(data);
};

// 2. Contar Sedes (CRÍTICO para la validación de Licencia SaaS)
const dbCountBranches = async () => {
    // Solo contamos las que no estén marcadas como eliminadas/inactivas si usas soft delete
    // Por ahora contamos todas.
    return await SystemBranch.countDocuments();
};

// 3. Listar todas las sedes
const dbGetAllBranches = async () => {
    return await SystemBranch.find().sort({ name: 1 }); // Ordenadas alfabéticamente
};

// 4. Obtener una sede por ID
const dbGetBranchById = async (id) => {
    return await SystemBranch.findById(id);
};

// 5. Actualizar sede
const dbUpdateBranch = async (id, data) => {
    return await SystemBranch.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
    );
};

// 6. Eliminar sede (Física o Lógica)
const dbDeleteBranch = async (id) => {
    return await SystemBranch.findByIdAndDelete(id);
};

export {
    dbCreateBranch,
    dbCountBranches,
    dbGetAllBranches,
    dbGetBranchById,
    dbUpdateBranch,
    dbDeleteBranch
};