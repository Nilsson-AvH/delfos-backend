import { Router } from "express";
import { createContract, deleteContractById, getAllContracts, getContractById, updateContractById } from "../controllers/contract.controller.js";

const router = Router();

// Define las rutas para /api/v1/contracts
router.post(`/`, createContract);
router.get(`/`, getAllContracts);
router.get(`/:idContract`, getContractById);
router.patch(`/:idContract`, updateContractById);
router.delete(`/:idContract`, deleteContractById);

export default router;
