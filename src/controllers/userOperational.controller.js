// =====================================================================
// CONTROLADOR DE OPERATIVOS (USER OPERATIONAL CONTROLLER)
// =====================================================================

import mongoose from 'mongoose';
import Client from '../models/Client.model.js'; // Importamos el modelo de Client para validar que el cliente exista
import { dbRegisterUser } from '../services/user.service.js'; // Importamos el servicio de registro de usuario
import {
    dbRegisterOperationalUser,
    dbCreateContract,
    dbCreateSocialSecurity
} from '../services/userOperational.service.js'; // Importamos los servicios de registro de operativo, contratos y parafiscales
import OperationalUser from '../models/users/UserOperational.model.js';

const createOperationalUser = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const data = req.body;

        const clientExists = await Client.findById(data.clientId);
        if (!clientExists) throw new Error(`Client with ID ${data.clientId} does not exist.`);

        // ---------------------------------------------------------------
        // PASO A: Crear Usuario Base
        // ---------------------------------------------------------------
        const [newUser] = await dbRegisterUser({
            nuip: data.nuip,
            names: data.names,
            lastName: data.lastName,
            secondLastName: data.secondLastName,
            email: data.email,
            role: 'operational',
            status: 'active',
            
            // 👇 AQUI MOVEMOS LA FOTO 👇
            // Si viene una foto en el registro (string URL), se la asignamos al User
            photo: data.photo || undefined 
        }, session);


        // ... (PASO B: Contrato y PASO C: Parafiscales quedan IGUALES) ...
        const [newContract] = await dbCreateContract({ /* ... data ... */ }, session);
        const [newSocialSecurity] = await dbCreateSocialSecurity({ /* ... data ... */ }, session);

        // ---------------------------------------------------------------
        // PASO D: Crear Perfil Operativo
        // ---------------------------------------------------------------
        const [newOperational] = await dbRegisterOperationalUser({
            user: newUser._id,
            currentClient: data.clientId,
            currentContract: newContract._id,
            currentSocialSecurity: newSocialSecurity._id,
            
            // ... (Historiales igual) ...
            employmentHistory: [{ entryDate: data.entryDate || new Date(), exitDate: null, exitReason: null }],
            clientHistory: [], contractHistory: [], socialSecurityHistory: [], documents: [],

            // ... (Datos personales Mapeados) ...
            birthDate: data.birthDate,
            birthPlace: data.birthPlace,
            issueDate: data.issueDate,
            issuePlace: data.issuePlace,
            nationality: data.nationality,
            gender: data.gender,
            maritalStatus: data.maritalStatus,
            height: data.height,
            weight: data.weight,
            
            // ❌ ELIMINADO: photo: data.photo (Ya no va aquí) ❌

            // ... (Resto igual: address, phones, emergency, family, etc.) ...
            address: data.address,
            neighborhood: data.neighborhood,
            housingType: data.housingType,
            phones: data.phones,
            emergencyContact: data.emergencyContact,
            emergencyContactPhone: data.emergencyContactPhone,
            emergencyContactRelationship: data.emergencyContactRelationship,
            hasVehicle: data.hasVehicle,
            vehicleType: data.vehicleType,
            driversLicense: data.driversLicense,
            licenseCategory: data.licenseCategory,
            familyGroup: data.familyGroup || [],
            academicInfo: data.academicInfo || [],
            languages: data.languages || []

        }, session);

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({
            msg: "Usuario Operativo creado exitosamente.",
            data: { operationalId: newOperational._id, userId: newUser._id }
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error al crear el usuario operativo:", error);
        return res.status(500).json({ msg: "Error al crear el usuario operativo", error: error.message });
    }
};

// // =====================================================================
// // PUT: Actualizar Foto de Perfil (Con borrado de la anterior)
// // =====================================================================
// const updateUserPhoto = async (req, res) => {
//     try {
//         const { userId } = req.body;
//         const file = req.file;

//         if (!userId) return res.status(400).json({ msg: "El userId es obligatorio." });
//         if (!file) return res.status(400).json({ msg: "No se ha subido ninguna imagen." });

//         // 1. Buscar al Usuario Operativo
//         const opUser = await OperationalUser.findOne({ user: userId });
//         if (!opUser) {
//             return res.status(404).json({ msg: "Perfil operativo no encontrado para este usuario." });
//         }

//         // 2. DETECTAR Y BORRAR FOTO ANTERIOR (Limpieza) 🧹
//         // Verificamos si tiene foto y si NO es la foto por defecto
//         const currentPhotoUrl = opUser.photo;
//         const defaultAvatar = 'https://cdn-icons-png.flaticon.com/128/3135/3135715.png';

//         if (currentPhotoUrl && currentPhotoUrl !== defaultAvatar && currentPhotoUrl.includes('cloudinary')) {
//             try {
//                 // Truco: Extraemos el public_id de la URL usando Regex
//                 // Busca todo lo que está después de '/upload/' (y opcionalmente la versión 'v123/') hasta el punto de la extensión
//                 const regex = /\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/;
//                 const match = currentPhotoUrl.match(regex);
                
//                 if (match && match[1]) {
//                     const publicId = match[1]; // ej: "delfos-avatars/tq9fywn..."
//                     console.log(`🗑️ Eliminando foto anterior: ${publicId}`);
//                     await cloudinary.uploader.destroy(publicId);
//                 }
//             } catch (deleteError) {
//                 console.error("⚠️ No se pudo eliminar la foto anterior de Cloudinary:", deleteError);
//                 // No detenemos el proceso, solo avisamos en consola
//             }
//         }

//         // 3. Subir la NUEVA foto
//         const uploadStream = new Promise((resolve, reject) => {
//             const stream = cloudinary.uploader.upload_stream(
//                 {
//                     folder: "delfos-avatars", 
//                     transformation: [
//                         { width: 500, height: 500, crop: "fill", gravity: "face" } 
//                     ]
//                 },
//                 (error, result) => {
//                     if (error) reject(error);
//                     else resolve(result);
//                 }
//             );
//             stream.end(file.buffer);
//         });

//         const cloudImage = await uploadStream;

//         // 4. Guardar nueva URL en BD
//         opUser.photo = cloudImage.secure_url;
//         await opUser.save();

//         res.json({
//             msg: "Foto actualizada correctamente (y la anterior eliminada)",
//             photoUrl: opUser.photo
//         });

//     } catch (error) {
//         console.error("❌ Error subiendo foto:", error);
//         res.status(500).json({ msg: "Error interno subiendo la foto", error: error.message });
//     }
// };

export {
    createOperationalUser
    // updateUserPhoto
}
