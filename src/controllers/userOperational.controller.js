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

const createOperationalUser = async (req, res) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const data = req.body;

        // Validamos que el cliente exista
        // Validación de negocio (puede ir aquí o en servicio, aquí está bien)
        const clientExists = await Client.findById(data.clientId);
        if (!clientExists) {
            throw new Error(`Client with ID ${data.clientId} does not exist.`);
        }

        // ---------------------------------------------------------------
        // PASO A: Crear Usuario Base (Vía Servicio)
        // ---------------------------------------------------------------
        // El servicio devuelve un array porque le pasamos sesión
        const [newUser] = await dbRegisterUser({
            nuip: data.nuip,
            names: data.names,
            lastName: data.lastName,
            secondLastName: data.secondLastName,
            email: data.email,
            role: 'operational',
            status: 'active'
        }, session); // <--- El servicio devuelve un array porque le pasamos sesión


        // ---------------------------------------------------------------
        // PASO B: Crear Contrato (Vía Servicio)
        // ---------------------------------------------------------------
        const [newContract] = await dbCreateContract({
            contractContent: data.contractContent || "Standard Contract",
            contractValue: data.contractValue,
            contractTermMonths: data.contractTermMonths,
            startDate: data.startDate,
            endDate: data.endDate,
            isActive: true
        }, session);


        // ---------------------------------------------------------------
        // PASO C: Crear Parafiscales Social Security (Vía Servicio)
        // ---------------------------------------------------------------
        const [newSocialSecurity] = await dbCreateSocialSecurity({
            arl: data.arl,
            arlRisk: data.arlRisk,
            arlDate: data.arlDate,

            eps: data.eps,
            epsDate: data.epsDate,

            compensationFund: data.compensationFund,
            compensationDate: data.compensationDate,

            pensionFund: data.pensionFund, // English key
            pensionDate: data.pensionDate,

            severanceFund: data.severanceFund, // English key
            severanceDate: data.severanceDate,

            lifeInsurance: data.lifeInsurance, // English key
            lifeInsuranceDate: data.lifeInsuranceDate
        }, session);


        // ---------------------------------------------------------------
        // PASO D: Crear Perfil Operativo (Enlace de todo)
        // ---------------------------------------------------------------
        const [newOperational] = await dbRegisterOperationalUser({
            // 1. Links
            user: newUser._id,
            currentClient: data.clientId,         // NEW ENGLISH FIELD
            currentContract: newContract._id,     // NEW ENGLISH FIELD
            currentSocialSecurity: newSocialSecurity._id, // NEW ENGLISH FIELD

            // 2. Histories
            employmentHistory: [{ // NEW ENGLISH FIELD
                entryDate: data.entryDate || new Date(),
                exitDate: null,
                exitReason: null
            }],
            clientHistory: [],
            contractHistory: [],
            socialSecurityHistory: [],
            documents: [],

            // 3. Personal Data (Mapped from req.body)
            birthDate: data.birthDate,
            birthPlace: data.birthPlace,
            issueDate: data.issueDate,
            issuePlace: data.issuePlace,
            nationality: data.nationality,
            gender: data.gender,             // Mujer, Hombre
            maritalStatus: data.maritalStatus, // Soltero, Casado, Divorciado, Viudo

            height: data.height,
            weight: data.weight,
            photo: data.photo,

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

            // Arrays
            familyGroup: data.familyGroup || [],
            academicInfo: data.academicInfo || [],
            languages: data.languages || []

        }, session);


        // ---------------------------------------------------------------
        // COMMIT
        // ---------------------------------------------------------------
        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({
            msg: "Usuario Operativo creado exitosamente.",
            data: {
                operationalId: newOperational._id,
                userId: newUser._id,
                email: newUser.email,
                client: clientExists.companyName
            }
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error al crear el usuario operativo:", error);

        if (error.code === 11000 || (error.message && error.message.includes('key duplicada'))) {
            return res.status(400).json({ msg: "Error: Datos duplicados (Email/Cedula)." });
        }
        return res.status(500).json({ msg: "Error al crear el usuario operativo", error: error.message });
    }
};

export {
    createOperationalUser
}
