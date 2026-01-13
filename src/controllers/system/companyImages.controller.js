import SystemCompany from '../../models/system/SystemCompany.model.js';
import { srvSaveCompanyFile, srvDeleteCompanyFile } from '../../services/storage/storage.service.js';

const updateCompanyImages = async (req, res) => {
    try {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({ msg: "No se enviaron imágenes para actualizar." });
        }

        // Seleccionamos los campos ocultos (+logoPublicId, etc.) para poder borrar
        const company = await SystemCompany.findOne().select(
            '+logoPublicId +logoProvider ' +
            '+logoHeaderPublicId +logoHeaderProvider ' +
            '+logoFooterPublicId +logoFooterProvider ' +
            '+watermarkPublicId +watermarkProvider ' +
            '+employeeFrontCardPublicId +employeeFrontCardProvider ' +
            '+employeeBackCardPublicId +employeeBackCardProvider ' +
            '+qrCodePublicId +qrCodeProvider ' +
            '+letterHeadPublicId +letterHeadProvider ' +
            '+signaturePublicId +signatureProvider'
        );

        if (!company) return res.status(404).json({ msg: "Empresa no configurada." });

        const updates = {};
        const files = req.files;

        // HELPER INTERNO
        const processField = async (formKey, dbUrlKey, dbIdKey, dbProviderKey, folder) => {
            if (files[formKey] && files[formKey][0]) {
                const file = files[formKey][0];
                const extension = file.mimetype.split('/')[1] || 'png';

                // A. Borrar anterior
                if (company[dbUrlKey] && company[dbIdKey]) {
                    await srvDeleteCompanyFile(
                        company[dbIdKey], 
                        company[dbProviderKey] || 'local', 
                        folder
                    );
                }

                // B. Subir nueva
                const result = await srvSaveCompanyFile(file.buffer, folder, extension);

                // C. Actualizar
                updates[dbUrlKey] = result.url;
                updates[dbIdKey] = result.publicId;
                updates[dbProviderKey] = result.provider;
            }
        };

        // Procesar campos (Carpetas organizadas)
        await processField('logo', 'logoUrl', 'logoPublicId', 'logoProvider', 'delfos-branding');
        await processField('logoHeader', 'logoHeaderUrl', 'logoHeaderPublicId', 'logoHeaderProvider', 'delfos-branding');
        await processField('logoFooter', 'logoFooterUrl', 'logoFooterPublicId', 'logoFooterProvider', 'delfos-branding');
        
        await processField('watermark', 'watermarkUrl', 'watermarkPublicId', 'watermarkProvider', 'delfos-assets');
        await processField('qrCode', 'qrCodeUrl', 'qrCodePublicId', 'qrCodeProvider', 'delfos-assets');
        await processField('letterHead', 'letterHeadUrl', 'letterHeadPublicId', 'letterHeadProvider', 'delfos-assets');
        await processField('signature', 'signatureUrl', 'signaturePublicId', 'signatureProvider', 'delfos-assets');

        await processField('employeeFrontCard', 'employeeFrontCardUrl', 'employeeFrontCardPublicId', 'employeeFrontCardProvider', 'delfos-carnets-assets');
        await processField('employeeBackCard', 'employeeBackCardUrl', 'employeeBackCardPublicId', 'employeeBackCardProvider', 'delfos-carnets-assets');

        const updatedCompany = await SystemCompany.findByIdAndUpdate(
            company._id, { $set: updates }, { new: true }
        );

        res.json({ msg: "Imágenes corporativas actualizadas.", data: updatedCompany });

    } catch (error) {
        console.error("Error updating company images:", error);
        res.status(500).json({ msg: "Error al actualizar imágenes.", error: error.message });
    }
};

export {
    updateCompanyImages
};