import CompanyDocument from "../models/CompanyDocument.model.js";

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
            .populate('user', 'names lastName nuip')   // Datos del dueño del documento
            .populate('generatedBy', 'names lastName jobTitle'); // Datos del firmante (Admin)

        // 2. Si no existe
        if (!doc) {
            return res.status(404).json({ 
                valid: false, 
                msg: "El documento no existe en nuestros registros o ha sido anulado." 
            });
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
                    fullName: `${doc.user.names} ${doc.user.lastName}`.toUpperCase(),
                    // Enmascaramos la cédula por privacidad pública (Ej: 100****55)
                    maskedId: maskID(doc.user.nuip) 
                },

                // ¿Quién lo firmó?
                signedBy: doc.generatedBy 
                    ? `${doc.generatedBy.names} ${doc.generatedBy.lastName}`.toUpperCase()
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
    // Muestra los primeros 3 y los últimos 2
    return `${str.slice(0, 3)}****${str.slice(-2)}`;
}

export {
    verifyDocumentByCUD
};