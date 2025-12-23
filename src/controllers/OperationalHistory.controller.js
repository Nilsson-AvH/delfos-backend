// =====================================================================
// OPERATIONAL HISTORY CONTROLLER
// Handles lifecycle events: Transfers, Renewals, and Updates.
// =====================================================================

import Client from '../models/Client.model.js'; // Solo para validar existencia del cliente
import {
    dbTransferOperationalUser,
    dbRenewOperationalContract,
    dbUpdateOperationalSocialSecurity
} from '../services/userOperational.service.js';

// =====================================================================
// 1. TRANSFER (Rotación de Puesto)
// =====================================================================
const transferOperationalUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { newClientId, reason, previousStartDate } = req.body;

        // A. Validaciones Previas
        if (!newClientId) {
            return res.status(400).json({ msg: "Debe proporcionar el ID del nuevo cliente (newClientId)." });
        }

        const clientExists = await Client.findById(newClientId);
        if (!clientExists) {
            return res.status(404).json({ msg: "El cliente destino no existe." });
        }

        // B. Ejecutar lógica de servicio
        const updatedUser = await dbTransferOperationalUser(
            id,
            newClientId,
            reason,
            previousStartDate
        );

        if (!updatedUser) {
            return res.status(404).json({ msg: "Usuario operativo no encontrado." });
        }

        res.json({
            msg: "Traslado exitoso (Historial actualizado).",
            data: {
                worker: updatedUser._id,
                newClient: clientExists.companyName,
                historyCount: updatedUser.clientHistory.length
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al realizar el traslado", error: error.message });
    }
};

// =====================================================================
// 2. CONTRACT RENEWAL (Renovación de Contrato)
// =====================================================================
const renewContract = async (req, res) => {
    try {
        const { id } = req.params;
        const contractData = req.body; // { contractValue, startDate, endDate... }

        const updatedUser = await dbRenewOperationalContract(id, contractData);

        if (!updatedUser) {
            return res.status(404).json({ msg: "Usuario operativo no encontrado" });
        }

        res.json({
            msg: "Contrato renovado exitosamente.",
            currentContractId: updatedUser.currentContract
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al renovar contrato", error: error.message });
    }
};

// =====================================================================
// 3. SOCIAL SECURITY UPDATE (Actualización Parafiscales)
// =====================================================================
const updateSocialSecurity = async (req, res) => {
    try {
        const { id } = req.params;
        const { changeReason, ...ssData } = req.body;

        const updatedUser = await dbUpdateOperationalSocialSecurity(id, ssData, changeReason);

        if (!updatedUser) {
            return res.status(404).json({ msg: "Usuario operativo no encontrado" });
        }

        res.json({
            msg: "Seguridad Social actualizada y archivada.",
            currentSSId: updatedUser.currentSocialSecurity
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al actualizar seguridad social", error: error.message });
    }
};

// =====================================================================
// EXPORTS
// =====================================================================
export {
    transferOperationalUser,
    renewContract,
    updateSocialSecurity
};