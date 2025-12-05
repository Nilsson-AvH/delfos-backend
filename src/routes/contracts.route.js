import { Router } from "express";
import { createContract, deleteContractById, getAllContracts, getContractById, updateContractById } from "../controllers/contract.controller.js";

const router = Router();

// Define las rutas para /api/v1/contracts
router.get(`/`, getAllContracts);
router.post(`/`, createContract);
router.get(`/:id`, getContractById);
router.patch(`/:id`, updateContractById);
router.delete(`/:id`, deleteContractById);


export default router;
