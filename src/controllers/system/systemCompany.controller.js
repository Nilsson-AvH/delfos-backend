import moment from 'moment'; // <--- IMPORTAR FECHA
import {
    dbGetCompanyConfig,
    dbCreateCompanyConfig,
    dbCountCompanyConfig,
    dbUpdateCompanyConfig
} from '../../services/system/systemCompany.service.js';

// =====================================================================
// GET: Obtener la configuración actual
// =====================================================================
const getCompanyConfig = async (req, res) => {
    try {
        const config = await dbGetCompanyConfig();
        if (!config) return res.status(200).json({ configured: false, data: null });
        res.json({ configured: true, data: config });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error obteniendo configuración", error: error.message });
    }
};

// =====================================================================
// POST: Crear configuración (INICIO DEL MODO DEMO 🚀)
// =====================================================================
const createCompanyConfig = async (req, res) => {
    try {
        // 1. Singleton Check
        const count = await dbCountCompanyConfig();
        if (count > 0) {
            return res.status(400).json({ msg: "⛔ Ya existe una empresa configurada." });
        }

        const inputData = req.body;

        // 2. LÓGICA DEL "GANCHO" (HOOK) 🪝
        // Si NO es ROOT (es decir, es un cliente nuevo instalando el software),
        // le regalamos 30 días de "droga gratis" para que se vuelva adicto.
        if (req.role !== 'root') {
            
            console.log(`🎁 Nuevo cliente registrado. Activando MODO DEMO de 30 días.`);

            // A. ACTIVACIÓN AUTOMÁTICA
            inputData.subscriptionStatus = 'active'; // ¡Pasa derecho!
            inputData.planType = 'demo_trial';       // Marcamos que es un demo
            
            // B. FECHA DE CADUCIDAD (30 DÍAS EXACTOS)
            // Usamos moment para sumar 30 días a la fecha actual
            inputData.validUntil = moment().add(30, 'days').toDate();
            
            // C. LÍMITES GENEROSOS (Para que se enamoren)
            // Les damos suficiente espacio para probar de verdad. 
            // Si les das muy poco (ej: 2 usuarios), no pueden hacer la prueba real de campo.
            inputData.maxBranchesAllowed = 1;  // 1 Sede (Suficiente para probar)
            inputData.maxUsersAllowed = 5;    // 5 Empleados Administrativos (ilimitado en operativos y clientes, para que prueben el software)
            
            // D. SEGURIDAD
            // Eliminamos cualquier intento de inyección de llaves o fechas falsas
            delete inputData.licenseKey; 
        }

        // Si es ROOT, dejamos pasar lo que venga en el body (tu control manual)

        const newConfig = await dbCreateCompanyConfig(inputData);
        
        // Mensaje Psicológico para el Frontend
        const successMsg = req.role === 'root' 
            ? "Sistema inicializado (Modo Root)" 
            : "¡Bienvenido! Su MODO DEMO de 30 días está activo. Disfrute del software 🚀";

        res.status(201).json({ 
            msg: successMsg,
            data: newConfig 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error configurando sistema", error: error.message });
    }
};

// =====================================================================
// PUT: Actualizar configuración
// =====================================================================
const updateCompanyConfig = async (req, res) => {
    try {
        const config = await dbGetCompanyConfig();
        if (!config) return res.status(404).json({ msg: "No hay configuración. Cree una primero." });

        let dataToUpdate = { ...req.body };

        // 3. 🛡️ SEGURIDAD SAAS: EL CLIENTE NO PUEDE EXTENDER SU DEMO
        if (req.role !== 'root') {
            // Bloqueamos los campos críticos
            delete dataToUpdate.subscriptionStatus;
            delete dataToUpdate.validUntil;
            delete dataToUpdate.licenseKey;
            delete dataToUpdate.maxBranchesAllowed;
            delete dataToUpdate.maxUsersAllowed;
            delete dataToUpdate.planType;
        }

        const updatedConfig = await dbUpdateCompanyConfig(config._id, dataToUpdate);

        res.json({ msg: "Datos actualizados correctamente", data: updatedConfig });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error actualizando configuración", error: error.message });
    }
};

export {
    getCompanyConfig,
    createCompanyConfig,
    updateCompanyConfig
};