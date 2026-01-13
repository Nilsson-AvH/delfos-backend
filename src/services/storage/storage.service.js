import { saveFileStrategy, deleteFileStrategy } from '../../helpers/storage.helper.js';
import { dbGetCompanyConfig } from '../system/systemCompany.service.js';

/**
 * Servicio Centralizado de Almacenamiento
 * Obtiene la configuración de la empresa y guarda el archivo.
 */
const srvSaveCompanyFile = async (fileBuffer, folderCategory, extension = 'pdf') => {
    
    // 1. Obtener configuración actual de la empresa (Singleton)
    const companyConfig = await dbGetCompanyConfig();
    
    if (!companyConfig) {
        throw new Error("Error Crítico: No hay configuración de empresa para determinar el almacenamiento.");
    }

    // 2. Delegar al Helper (Strategy Pattern)
    const result = await saveFileStrategy(fileBuffer, companyConfig, folderCategory, extension);

    return result; // Retorna { url, publicId, provider }
};

const srvDeleteCompanyFile = async (publicId, provider, folderCategory) => {
    const companyConfig = await dbGetCompanyConfig();
    return await deleteFileStrategy(publicId, provider, companyConfig, folderCategory);
};

export {
    srvSaveCompanyFile,
    srvDeleteCompanyFile
}