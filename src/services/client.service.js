// =====================================================================
// CLIENT SERVICE (Company Logic)
// =====================================================================
import ClientModel from "../models/Client.model.js";

// =====================================================================
// 1. CREATE
const dbCreateClient = async (data) => {
    // Logica de negocio: Inicializa el historial con el primer gerente
    const clientData = {
        ...data,
        managersHistory: [{
            manager: data.clientManager, // ID del manager inicial
            startDate: new Date(),
            endDate: null
        }]
    };
    return await ClientModel.create(clientData);
};

// =====================================================================
// 2. READ
const dbGetAllClients = async () => {
    return await ClientModel.find()
        .populate("clientManager", "names lastName email") // Trae nombre del manager actual
        .sort({ createdAt: -1 });
};

const dbGetClientById = async (id) => {
    return await ClientModel.findById(id)
        .populate("clientManager", "names lastName email")
        .populate("managersHistory.manager", "names lastName email");
};

// =====================================================================
// 3. UPDATE (General Info)
const dbUpdateClientById = async (id, data) => {
    return await ClientModel.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
    );
};

// =====================================================================
// 4. UPDATE SPECIAL (Change Manager Logic)
/**
 * Maneja la lógica compleja de rotación de gerentes.
 * Cierra el ciclo del anterior y abre uno nuevo.
 */
const dbUpdateClientManager = async (clientId, newManagerId, reason) => {
    const client = await ClientModel.findById(clientId);
    if (!client) return null;

    // A. Cerrar el historial del manager actual (endDate: null -> now)
    const currentHistory = client.managersHistory.find(h => h.endDate === null);
    if (currentHistory) {
        currentHistory.endDate = new Date();
        if (reason) currentHistory.reason = reason;
    }

    // B. Actualizar el puntero actual
    client.clientManager = newManagerId;

    // C. Abrir nuevo registro en historial
    client.managersHistory.push({
        manager: newManagerId,
        startDate: new Date(),
        endDate: null
    });

    return await client.save();
};

// =====================================================================
// 5. DELETE
const dbDeleteClientById = async (id) => {
    return await ClientModel.findByIdAndDelete(id);
};

// =====================================================================
// Exportar las funciones
export {
    dbCreateClient,
    dbGetAllClients,
    dbGetClientById,
    dbUpdateClientById,
    dbUpdateClientManager,
    dbDeleteClientById
};