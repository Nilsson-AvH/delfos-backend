import multer from 'multer';

// Configuración de almacenamiento: MEMORIA (Para subir directo a Cloudinary sin guardar en disco)
const storage = multer.memoryStorage();

// Filtro de archivos (Solo imágenes)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Formato de archivo no válido. Solo se permiten imágenes (jpg, png, jpeg).'), false);
    }
};

const uploadImage = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // Límite de 5MB
    }
});

export {
    uploadImage
};
