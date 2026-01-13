import { 
    dbCreateBranch, 
    dbCountBranches, // <--- IMPORTANTE PARA EL SAAS
    dbGetAllBranches 
} from '../../services/system/systemBranch.service.js';
import { dbGetCompanyConfig } from '../../services/system/systemCompany.service.js';

// =====================================================================
// POST: Crear Nueva Sede (Con validación de Licencia)
// =====================================================================
const createBranch = async (req, res) => {
    try {
        // 1. Obtener los límites de la empresa
        const companyConfig = await dbGetCompanyConfig();
        if (!companyConfig) {
            return res.status(500).json({ msg: "Error crítico: No se ha configurado la empresa base (SystemCompany)." });
        }

        // 2. Contar cuántas sedes existen ya
        const currentBranchesCount = await dbCountBranches();

        // 3. 🛑 EL MURO DE PAGO (Check de Licencia)
        // Si ya tiene las permitidas (o más), bloqueamos.
        if (currentBranchesCount >= companyConfig.maxBranchesAllowed) {
            return res.status(403).json({ 
                msg: `⛔ Límite alcanzado. Su plan actual solo permite ${companyConfig.maxBranchesAllowed} sedes. Contacte a soporte para ampliar su plan.` 
            });
        }

        // 4. Si pasa la validación, creamos la sede
        const newBranch = await dbCreateBranch(req.body);

        res.status(201).json({ msg: "Sede creada exitosamente", data: newBranch });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error creando sede", error: error.message });
    }
};

// =====================================================================
// GET: Listar Sedes
// =====================================================================
const getAllBranches = async (req, res) => {
    try {
        const branches = await dbGetAllBranches();
        res.json({ branches });
    } catch (error) {
        res.status(500).json({ msg: "Error listando sedes" });
    }
};

export {
    createBranch,
    getAllBranches
};
