import { cloudinary } from "../config/cloudinary.config.js";
import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Config Global Cloudinary (Carga variables de entorno por defecto)

// cloudinary.config({
//     cloud_name: process.env.CLOUD_NAME,
//     api_key: process.env.API_KEY,
//     api_secret: process.env.API_SECRET
// });

/**
 * Guarda un archivo según la estrategia configurada (Local, S3/MinIO, Cloudinary)
 * @param {Buffer} fileBuffer - Archivo en memoria
 * @param {Object} companyConfig - Configuración de la empresa (SystemCompany)
 * @param {String} folderName - Subcarpeta destino (ej: 'contratos')
 * @param {String} extension - 'pdf', 'png', etc.
 */

/**
 * 👇 ESTRATEGIA DE GUARDADO 👇
 */
const saveFileStrategy = async (fileBuffer, companyConfig, folderName, extension = 'pdf') => {
    
    // Si no hay proveedor definido, usar 'local' por defecto
    const provider = companyConfig.storageProvider || 'local';
    console.log(`💾 Storage Strategy: [${provider.toUpperCase()}] > Carpeta: ${folderName}`);

    // ---------------------------------------------------------
    // OPCIÓN A: LOCAL (Gratis / On-Premise)
    // ---------------------------------------------------------
    if (provider === 'local') {
        const fileName = `${uuidv4()}.${extension}`;
        // Ruta física: /tu-proyecto/public/uploads/carpeta
        const uploadPath = path.join(process.cwd(), 'public', 'uploads', folderName);
        
        await fs.ensureDir(uploadPath); // Crea la carpeta si no existe
        await fs.writeFile(path.join(uploadPath, fileName), fileBuffer);

        // Construir URL pública
        const baseUrl = process.env.APP_URL || companyConfig.backendUrl || process.env.API_URL || 'http://localhost:3000';
        return {
            url: `${baseUrl}/uploads/${folderName}/${fileName}`,
            publicId: fileName,
            provider: 'local'
        };
    }

    // ---------------------------------------------------------
    // OPCIÓN B: S3 (AWS / MinIO / DigitalOcean)
    // ---------------------------------------------------------
    if (provider === 's3') {
        const { endpoint, bucketName, region, accessKeyId, secretAccessKey } = companyConfig.s3Config;

        if (!bucketName || !accessKeyId || !secretAccessKey) {
            throw new Error("Faltan credenciales S3 en la configuración de la empresa.");
        }

        // Inicializar Cliente S3 (Agnóstico)
        const s3Client = new S3Client({
            region: region || "us-east-1",
            endpoint: endpoint || undefined, // undefined para AWS real
            credentials: { accessKeyId, secretAccessKey },
            forcePathStyle: true // Necesario para MinIO
        });

        const fileName = `${folderName}/${uuidv4()}.${extension}`;

        await s3Client.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: fileName,
            Body: fileBuffer,
            ContentType: extension === 'pdf' ? 'application/pdf' : 'image/jpeg'
            // ACL: 'public-read' // Descomentar si tu bucket requiere ACL explícita
        }));

        // Construir URL Pública
        const publicUrl = endpoint 
            ? `${endpoint}/${bucketName}/${fileName}` // Estilo MinIO
            : `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`; // Estilo AWS

        return { url: publicUrl, publicId: fileName, provider: 's3' };
    }

    // ---------------------------------------------------------
    // OPCIÓN C: CLOUDINARY (Multimedia SaaS)
    // ---------------------------------------------------------
    if (provider === 'cloudinary') {
        return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: folderName, resource_type: 'raw', format: extension },
                (error, result) => error ? reject(error) : resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                    provider: 'cloudinary'
                })
            );
            stream.end(fileBuffer);
        });
    }

    throw new Error(`Proveedor de almacenamiento desconocido: ${provider}`);
};

/**
 * 👇 ESTRATEGIA DE ELIMINADO (Esto arregla el error al borrar) 👇
 */
const deleteFileStrategy = async (publicId, provider, companyConfig, folderName) => {
    console.log(`🗑️ Eliminando de: [${provider?.toUpperCase()}] -> ${publicId}`);

    // --- LOCAL ---
    if (provider === 'local') {
        try {
            // Construir ruta absoluta
            const filePath = path.join(process.cwd(), 'public', 'uploads', folderName, publicId);
            
            // 👇 DEBUG: MIRA ESTO EN TU CONSOLA CUANDO BORRES 👇
            console.log(`🔍 Buscando archivo en disco: "${filePath}"`);

            if (await fs.pathExists(filePath)) {
                await fs.unlink(filePath);
                console.log("✅ Archivo físico eliminado con éxito.");
            } else {
                console.warn("⚠️ ALERTA: El sistema no encontró el archivo en esa ruta. ¿La carpeta es correcta?");
            }
            return true;
        } catch (error) {
            console.error("❌ ERROR CRÍTICO borrando local:", error);
            return false; 
        }
    }

    // --- CLOUDINARY ---
    if (provider === 'cloudinary') {
        return new Promise((resolve, reject) => {
            // Usamos la instancia importada que ya tiene las llaves ✅
            cloudinary.uploader.destroy(publicId, { resource_type: 'raw' }, (error, result) => {
                if (error) return reject(error);
                resolve(result);
            });
        });
    }

    // --- S3 ---
    if (provider === 's3') {
        const { endpoint, bucketName, region, accessKeyId, secretAccessKey } = companyConfig.s3Config;
        const s3Client = new S3Client({
            region: region || "us-east-1",
            endpoint: endpoint || undefined,
            credentials: { accessKeyId, secretAccessKey },
            forcePathStyle: true
        });

        await s3Client.send(new DeleteObjectCommand({
            Bucket: bucketName,
            Key: `${folderName}/${publicId}` 
        }));
        return true;
    }
};

export { 
    saveFileStrategy, 
    deleteFileStrategy 
};