import { Router } from "express";
import { verifyDocumentByCUD } from "../controllers/public.controller.js";

const router = Router();

// GET /api/public/verify/:cud
// Ejemplo: /api/public/verify/A1B2C3D4
router.get('/verify/:cud', verifyDocumentByCUD);

export default router;