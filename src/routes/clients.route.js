import { Router } from "express";
import {
    createClient,
    deleteClientById,
    getAllClients,
    getClientById,
    updateClientById,
    updateClientManager // Importamos el nuevo endpoint especial
} from "../controllers/client.controller.js";

const router = Router();

// Rutas base: /api/v1/clients

router.post(`/`, createClient);
router.get(`/`, getAllClients);

// Rutas por ID
// NOTA: Cambiamos :idClient por :id para estandarizar
router.get(`/:id`, getClientById);
router.patch(`/:id`, updateClientById); // Actualizar info básica (Dirección, Teléfono)
router.delete(`/:id`, deleteClientById);

// Ruta Especial: Rotación de Gerente
// PATCH /api/v1/clients/:id/manager
router.patch(`/:id/manager`, updateClientManager);

export default router;