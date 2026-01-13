import SystemCompany from '../models/system/SystemCompany.model.js';
import moment from 'moment';

export const validateLicenseStatus = async (req, res, next) => {
    try {        
        // 1. OBTENER CONFIGURACIÓN
        const companyConfig = await SystemCompany.findOne();

        // CASO: No existe configuración en BD
        if (!companyConfig) {
            console.log("⚠️ DEBUG: No se encontró configuración en MongoDB.");
            if (req.originalUrl.includes('system-company') && req.method === 'POST') {
                return next();
            }
            return res.status(500).json({ msg: "Error Crítico: El sistema no ha sido inicializado." });
        }

        // 2. DEBUG DE FECHAS (Aquí suele estar el error) 🕵️‍♂️
        if (!companyConfig.validUntil) {
            console.error("❌ ERROR: El campo 'validUntil' no existe en la BD.");
            throw new Error("Fecha de validez no encontrada en la configuración.");
        }

        const today = moment();
        const expirationDate = moment(companyConfig.validUntil);
        
        // Verificar si la fecha es válida para Moment
        if (!expirationDate.isValid()) {
            console.error(`❌ ERROR: Fecha inválida detectada en BD: ${companyConfig.validUntil}`);
            throw new Error(`Formato de fecha corrupto: ${companyConfig.validUntil}`);
        }

        // 3. LÓGICA DE AVISO (Grace Period)
        const daysRemaining = expirationDate.diff(today, 'days');
        
        // console.log(`🔍 DEBUG LICENCIA: Vence: ${expirationDate.format()} | Días Restantes: ${daysRemaining}`);

        if (daysRemaining >= 0 && daysRemaining <= 7) {
            res.setHeader('Access-Control-Expose-Headers', 'x-license-warning');
            res.setHeader('x-license-warning', `[ALERTA] Su licencia vence en ${daysRemaining} dias.`); 
        }

        // 4. REGLAS DE PERMISOS

        // A. ROOT SIEMPRE PASA
        // Usamos ?. para evitar crash si req.role no viene
        if (req.role === 'root') {
            return next();
        }

        // B. SOLO LECTURA SIEMPRE PASA (GET)
        if (req.method === 'GET') {
            return next();
        }

        // C. VERIFICAR BLOQUEOS 🛑
        
        if (companyConfig.subscriptionStatus === 'suspended') {
            return res.status(402).json({ 
                msg: "⛔ SERVICIO SUSPENDIDO. Su cuenta está inactiva manualmente." 
            });
        }

        // AQUÍ ES DONDE QUEREMOS QUE LLEGUE 👇
        if (today.isAfter(expirationDate)) {
            return res.status(402).json({ 
                msg: `⛔ LICENCIA VENCIDA. Su plan expiró el ${expirationDate.format('DD/MM/YYYY')}. El sistema está en modo 'Solo Lectura'.` 
            });
        }

        next();

    } catch (error) {
        // ESTO SALDRÁ EN TU TERMINAL
        console.error("❌ CRASH EN LICENSE MIDDLEWARE:", error); 
        res.status(500).json({ 
            msg: "Error interno validando permisos de licencia.",
            details: error.message // <--- Te dirá qué pasó en Postman
        });
    }
};