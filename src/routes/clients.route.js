import { Router } from "express";
import {
    createClient,
    deleteClientById,
    getAllClients,
    getClientById,
    updateClientById,
    updateClientManager // Importamos el nuevo endpoint especial
} from "../controllers/client.controller.js";
import authenticationUser from "../middlewares/authentication.middleware.js";
import authorizationUser from "../middlewares/authorization.middleware.js";

const router = Router();

// Rutas base: /api/v1/clients

router.post(`/`, [authenticationUser, authorizationUser], createClient);
router.get(`/`, [authenticationUser, authorizationUser], getAllClients);

// Rutas por ID
// NOTA: Cambiamos :idClient por :id para estandarizar
router.get(`/:id`, [authenticationUser, authorizationUser], getClientById);
router.patch(`/:id`, [authenticationUser, authorizationUser], updateClientById); // Actualizar info básica (Dirección, Teléfono)
router.delete(`/:id`, [authenticationUser, authorizationUser], deleteClientById);

// Ruta Especial: Rotación de manager o administrador del cliente
// PATCH /api/v1/clients/:id/manager
router.patch(`/:id/manager`, [authenticationUser, authorizationUser], updateClientManager);

export default router;