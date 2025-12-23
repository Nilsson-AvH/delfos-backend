// =====================================================================
// CLIENT CONTROLLER (Refactorizado con Validación Inteligente)
// =====================================================================
import {
    dbCreateClient,
    dbGetAllClients,
    dbGetClientById,
    dbUpdateClientById,
    dbDeleteClientById,
    dbUpdateClientManager
} from "../services/client.service.js";

// Importamos AMBAS funciones de búsqueda
import {
    dbGetClientManagerUserById,      // Busca por ID de Perfil (Profile ID)
    dbGetClientManagerProfileByUserId // Busca por ID de Usuario (User ID)
} from "../services/user.service.js";

// =====================================================================
// CREATE
const createClient = async (req, res) => {
    try {
        const inputData = req.body;

        // --- VALIDACIÓN INTELIGENTE DE MANAGER ---
        if (inputData.clientManager) {

            // 1. Intento A: ¿Me enviaron el ID del Perfil directamente?
            let managerProfile = await dbGetClientManagerUserById(inputData.clientManager);

            // 2. Intento B: ¿Me enviaron el ID del Usuario Base?
            if (!managerProfile) {
                // Buscamos si existe un perfil asociado a ese usuario
                managerProfile = await dbGetClientManagerProfileByUserId(inputData.clientManager);
            }

            // 3. Veredicto Final
            if (!managerProfile) {
                return res.status(404).json({
                    msg: "Error: El Manager especificado no existe (ni como Perfil ni como Usuario)."
                });
            }

            // 4. AUTO-CORRECCIÓN: Aseguramos guardar siempre el ID del Perfil (Relation)
            // Si el usuario envió el ID de usuario, aquí lo cambiamos silenciosamente por el del perfil
            inputData.clientManager = managerProfile._id;
        }
        // -----------------------------------------------------

        const newClient = await dbCreateClient(inputData);
        res.status(201).json({ msg: "Cliente creado exitosamente", data: newClient });

    } catch (error) {
        console.error(error);
        if (error.code === 11000) {
            return res.status(409).json({ msg: "El NIT ya existe en el sistema." });
        }
        res.status(500).json({ msg: "Error al crear cliente", error: error.message });
    }
};

// =====================================================================
// READ ALL
const getAllClients = async (req, res) => {
    try {
        const clients = await dbGetAllClients();
        res.json({ clients });
    } catch (error) {
        res.status(500).json({ msg: "Error consultando clientes" });
    }
};

// =====================================================================
// READ ONE
const getClientById = async (req, res) => {
    try {
        const { id } = req.params;
        const client = await dbGetClientById(id);

        if (!client) {
            return res.status(404).json({ msg: "Cliente no encontrado" });
        }
        res.json({ client });
    } catch (error) {
        res.status(500).json({ msg: "Error al buscar cliente" });
    }
};

// =====================================================================
// UPDATE INFO
const updateClientById = async (req, res) => {
    try {
        const { id } = req.params;
        const clientUpdated = await dbUpdateClientById(id, req.body);

        if (!clientUpdated) {
            return res.status(404).json({ msg: "Cliente no encontrado para actualizar" });
        }
        res.json({ msg: "Cliente actualizado", data: clientUpdated });
    } catch (error) {
        res.status(500).json({ msg: "Error al actualizar cliente" });
    }
};

// =====================================================================
// UPDATE MANAGER (Rotación)
const updateClientManager = async (req, res) => {
    try {
        const { id } = req.params;
        const { newManagerId, reason } = req.body;

        if (!newManagerId) {
            return res.status(400).json({ msg: "Debe enviar el ID del nuevo manager (newManagerId)." });
        }

        // --- VALIDACIÓN INTELIGENTE TAMBIÉN AQUÍ ---
        let finalManagerId = newManagerId;

        // Verificamos si es User ID o Profile ID
        let managerProfile = await dbGetClientManagerUserById(newManagerId);
        if (!managerProfile) {
            managerProfile = await dbGetClientManagerProfileByUserId(newManagerId);
        }

        if (!managerProfile) {
            return res.status(404).json({ msg: "El nuevo Manager no existe." });
        }

        finalManagerId = managerProfile._id;
        // -------------------------------------------

        const clientUpdated = await dbUpdateClientManager(id, finalManagerId, reason);

        if (!clientUpdated) {
            return res.status(404).json({ msg: "Cliente no encontrado" });
        }

        res.json({ msg: "Manager actualizado y historial registrado", data: clientUpdated });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al cambiar de manager", error: error.message });
    }
};

// =====================================================================
// DELETE
const deleteClientById = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await dbDeleteClientById(id);

        if (!deleted) return res.status(404).json({ msg: "Cliente no encontrado" });
        res.json({ msg: "Cliente eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ msg: "Error eliminando cliente" });
    }
};

// =====================================================================
// Exportar las funciones
export {
    createClient,
    getAllClients,
    getClientById,
    updateClientById,
    updateClientManager,
    deleteClientById
};
