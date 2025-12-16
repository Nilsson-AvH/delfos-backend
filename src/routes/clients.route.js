import express from "express";
import { createClient, deleteClientById, getAllClients, getClientById, updateClientById } from "../controllers/client.controller.js";

const router = express.Router();

// Definicion de las rutas (EndPoints)
router.post(`/`, createClient)
router.get(`/`, getAllClients)
router.get(`/:idClient`, getClientById)
router.patch(`/:idClient`, updateClientById)
router.delete(`/:idClient`, deleteClientById)

export default router;
