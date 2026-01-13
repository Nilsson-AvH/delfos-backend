import { srvSaveCompanyFile } from "../../services/storage/storage.service.js";

const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: "No se envió ningún archivo." });
        }

        // Determinar extensión (simple)
        const extension = req.file.mimetype.split('/')[1] || 'bin';

        // Guardar usando la configuración de la empresa actual
        const result = await srvSaveCompanyFile(
            req.file.buffer, 
            'uploads-generales', 
            extension
        );

        res.status(201).json({
            msg: "Archivo subido exitosamente",
            file: result
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al subir archivo", error: error.message });
    }
};

export {
    uploadFile
}
