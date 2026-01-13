import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

// --- ZONA DE COMPATIBILIDAD (EL FIX) ---
import multerStorageCloudinary from 'multer-storage-cloudinary';

// Intentamos encontrar la clase en las diferentes estructuras posibles
const CloudinaryStorage = multerStorageCloudinary.CloudinaryStorage ||
    multerStorageCloudinary.default?.CloudinaryStorage ||
    multerStorageCloudinary;

// DEBUG: Si esto sale "undefined" en la consola, sabremos que es el problema
// console.log("--> Debug CloudinaryStorage:", CloudinaryStorage); 
// ---------------------------------------

dotenv.config();

// 1. Configurar credenciales
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. Configurar Storage
// Validamos que la clase exista antes de usar 'new'
if (typeof CloudinaryStorage !== 'function') {
    throw new Error('No se pudo cargar la clase CloudinaryStorage. Revisa la versión de la librería.');
}

const storage = new CloudinaryStorage({
    cloudinary: { v2: cloudinary },
    params: {
        folder: 'delfos-docs',
        allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'],
        resource_type: 'auto'
    },
});

// 3. Crear el Middleware
const uploadCloud = multer({ storage });

export { cloudinary }; 
export default uploadCloud;