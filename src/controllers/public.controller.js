import CompanyDocument from "../models/CompanyDocument.model.js";
import OperationalUser from "../models/users/UserOperational.model.js"; 
import Contract from "../models/Contract.model.js";

// =================================================================
// 🔍 VERIFICAR DOCUMENTO POR CUD (Público)
// =================================================================
const verifyDocumentByCUD = async (req, res) => {
    try {
        const { cud } = req.params;

        if (!cud) {
            return res.status(400).json({ valid: false, msg: "Debe proporcionar un código CUD." });
        }

        // 1. Buscamos el documento (Convertimos a Mayúsculas para evitar errores)
        const doc = await CompanyDocument.findOne({ cud: cud.toUpperCase() })
            .populate('user', 'names lastName secondLastName nuip')   // Datos del dueño del documento
            .populate('generatedBy', 'names lastName secondLastName jobTitle'); // Datos del firmante (Admin)

        // 2. Si no existe
        if (!doc) {
            return res.status(404).json({ 
                valid: false, 
                msg: "El documento no existe en nuestros registros o ha sido anulado." 
            });
        }

        // 2.1. RECUPERAR EL CARGO (contractContent) 🕵️‍♂️
        let position = "Información no disponible";

        // ESTRATEGIA A: Integridad Histórica
        // Si el documento es un Contrato o Certificado, el 'referenceId' apunta al Contrato específico.
        if (['ContratoLaboral', 'CertificadoLaboral'].includes(doc.documentType) && doc.referenceId) {
            // Hacemos populate dinámico indicando que referenceId es un 'Contract'
            await doc.populate({ path: 'referenceId', model: 'Contract', select: 'contractContent' });
            
            if (doc.referenceId && doc.referenceId.contractContent) {
                position = doc.referenceId.contractContent;
            }
        }

        // ESTRATEGIA B: Fallback al Presente
        // Si es una Carta/Carnet (cuyo referenceId no es un contrato) o si falló la estrategia A,
        // buscamos el cargo ACTUAL del empleado en su perfil operativo.
        if ((position === "Información no disponible") && doc.user) {
            const opUser = await OperationalUser.findOne({ user: doc.user._id })
                .select('currentContract')
                .populate('currentContract', 'contractContent');
            
            if (opUser?.currentContract?.contractContent) {
                position = opUser.currentContract.contractContent;
            }
        }

        // 3. RESPUESTA DE ÉXITO (Datos Públicos de Validación)
        // No mostramos el PDF ni datos sensibles, solo lo necesario para cotejar.
        res.json({
            valid: true,
            msg: "✅ Documento Auténtico y Vigente",
            verificationData: {
                documentType: formatDocType(doc.documentType), // Función auxiliar abajo
                cud: doc.cud,
                securityHash: doc.securityHash, // Vital para comparar con el papel
                issueDate: doc.createdAt,
                
                // ¿A quién pertenece?
                employee: {
                    fullName: `${doc.user.fullName}`.toUpperCase(),
                    // Enmascaramos la cédula por privacidad pública (Ej: 100****55)
                    maskedId: maskID(doc.user.nuip),
                    // nuip: doc.user.nuip,
                    position: position.toUpperCase()
                },

                // ¿Quién lo firmó?
                signedBy: doc.generatedBy 
                    ? `${doc.generatedBy.fullName}`.toUpperCase()
                    : "SISTEMA AUTOMÁTICO / REP. LEGAL"
            }
        });

    } catch (error) {
        console.error("Error verificando CUD:", error);
        res.status(500).json({ valid: false, msg: "Error interno del servidor al verificar." });
    }
};

// --- Helpers para formatear la respuesta visualmente ---

function formatDocType(type) {
    const map = {
        'ContratoLaboral': 'Contrato Individual de Trabajo',
        'CertificadoLaboral': 'Certificación Laboral',
        'CartaPresentacion': 'Carta de Presentación',
        'CarnetCorporativo': 'Carnet de Identificación'
    };
    return map[type] || type;
}

function maskID(id) {
    if (!id) return "N/A";
    const str = id.toString();
    if (str.length < 4) return str;
    // Muestra los primeros 1 y los últimos 3
    return `${str.slice(0, 1)}***${str.slice(-3)}`;
}

export {
    verifyDocumentByCUD
};