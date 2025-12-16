import mongoose from 'mongoose';
import OperationalUser from '../models/users/UserOperational.model.js';
import Contract from '../models/Contract.model.js';
import Parafiscales from '../models/Parafiscales.model.js';
import Client from '../models/Client.model.js';

// =====================================================================
// 1. ROTACIÓN DE CLIENTE (Cambio de Puesto)
// =====================================================================
export const rotateClient = async (req, res) => {
    const { id } = req.params; // ID del UserOperational
    const { newClientId, fechaCambio, motivo } = req.body;

    try {
        // 1. Verificar que el nuevo cliente exista
        const newClientExists = await Client.findById(newClientId);
        if (!newClientExists) return res.status(404).json({ message: "El nuevo cliente no existe" });

        // 2. Buscar al empleado
        const operational = await OperationalUser.findById(id);
        if (!operational) return res.status(404).json({ message: "Empleado no encontrado" });

        // 3. LOGICA DEL HISTORIAL
        // Tomamos el cliente DONDE ESTABA hasta hoy y lo guardamos en el cajón del recuerdo
        // Nota: Para 'fechaInicio' del historial, idealmente deberías tener guardado cuándo entró al cliente actual.
        // Si no lo tienes, usamos la fecha de creación del registro o una fecha aproximada.

        operational.historialClientes.push({
            cliente: operational.clienteActual, // El cliente viejo (antes de cambiarlo)
            fechaFin: fechaCambio || new Date(), // Hoy se acaba su turno allí
            fechaInicio: operational.updatedAt, // (Simplificación) O podrías pedir este dato si lo tienes
            motivoCambio: motivo || "Rotación operativa"
        });

        // 4. ACTUALIZAR AL PRESENTE
        operational.clienteActual = newClientId;

        await operational.save();

        return res.status(200).json({
            message: "Rotación de cliente exitosa",
            currentClient: newClientExists.companyName
        });

    } catch (error) {
        return res.status(500).json({ message: "Error en rotación", error: error.message });
    }
};


// =====================================================================
// 2. RENOVACIÓN DE CONTRATO (Nuevo Término)
// =====================================================================
export const renewContract = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;
        const {
            contractContent, contractValue, contractTermMonths, startDate, endDate
        } = req.body;

        const operational = await OperationalUser.findById(id).session(session);
        if (!operational) throw new Error("Empleado no encontrado");

        // A. DESACTIVAR CONTRATO ANTERIOR
        // Buscamos el contrato viejo y lo marcamos como inactivo
        await Contract.findByIdAndUpdate(
            operational.contractActual,
            { isActive: false },
            { session }
        );

        // B. CREAR EL NUEVO CONTRATO
        const [newContract] = await Contract.create([{
            contractContent,
            contractValue,
            contractTermMonths,
            startDate,
            endDate,
            isActive: true
        }], { session });

        // C. MOVER EL VIEJO AL HISTORIAL
        operational.historialContratos.push({
            contract: operational.contractActual, // El ID del viejo
            observaciones: `Renovación realizada el ${new Date().toLocaleDateString()}`
        });

        // D. ASIGNAR EL NUEVO COMO ACTUAL
        operational.contractActual = newContract._id;

        await operational.save({ session });
        await session.commitTransaction();

        return res.status(200).json({ message: "Contrato renovado exitosamente", newContractId: newContract._id });

    } catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ message: "Error renovando contrato", error: error.message });
    } finally {
        session.endSession();
    }
};


// =====================================================================
// 3. ACTUALIZACIÓN DE PARAFISCALES (Cambio de EPS/Fondo)
// =====================================================================
export const updateParafiscales = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;
        const {
            arl, arlRisk, eps, compensationFund, pensionsAndSeverance, cesantias, seguroVida, motivoCambio
        } = req.body;

        const operational = await OperationalUser.findById(id).session(session);
        if (!operational) throw new Error("Empleado no encontrado");

        // A. CREAR EL NUEVO REGISTRO DE PARAFISCALES
        // (Creamos uno nuevo completo para mantener la foto exacta de cómo está asegurado hoy)
        const [newParafiscales] = await Parafiscales.create([{
            arl, arlRisk, eps, compensationFund, pensionsAndSeverance, cesantias, seguroVida
        }], { session });

        // B. MOVER EL VIEJO AL HISTORIAL
        operational.historialParafiscales.push({
            parafiscales: operational.parafiscalesActuales, // ID del viejo
            fechaCambio: new Date(),
            motivoCambio: motivoCambio || "Actualización de datos"
        });

        // C. ASIGNAR EL NUEVO COMO ACTUAL
        operational.parafiscalesActuales = newParafiscales._id;

        await operational.save({ session });
        await session.commitTransaction();

        return res.status(200).json({ message: "Seguridad social actualizada", data: newParafiscales });

    } catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ message: "Error actualizando parafiscales", error: error.message });
    } finally {
        session.endSession();
    }
};