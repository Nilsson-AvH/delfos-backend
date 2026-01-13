import express from 'express';
import multer from 'multer'; // npm install multer
import authenticationUser from '../../middlewares/authentication.middleware.js';
import { uploadFile } from '../../controllers/storage/storage.controller.js';

const router = express.Router();
const upload = multer(); // Almacenamiento en memoria RAM temporal

router.use(authenticationUser);

// POST /api/v1/storage/upload
router.post('/upload', upload.single('file'), uploadFile);

export default router;