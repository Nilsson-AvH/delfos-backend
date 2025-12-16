import express from "express";
import { createParafiscal, deleteParafiscalById, getAllParafiscales, getParafiscalById, updateParafiscalById } from "../controllers/parafiscal.controller.js";

const router = express.Router();

// Definicion de las rutas (EndPoints)
router.post(`/`, createParafiscal)
router.get(`/`, getAllParafiscales)
router.get(`/:idParafiscal`, getParafiscalById)
router.patch(`/:idParafiscal`, updateParafiscalById)
router.delete(`/:idParafiscal`, deleteParafiscalById)

export default router;