import 'dotenv/config';
import express from "express";
import cors from "cors";
import dbConnection from "./config/mongo.config.js";

// 1. IMPORTAR RUTAS
import authRoute from "./routes/auth.route.js";
import publicRoutes from "./routes/public.routes.js";
import usersRoute from "./routes/users/users.route.js";
import documentsRoute from "./routes/documents.route.js";
import clientsRoute from "./routes/clients.route.js";
import docGeneratorRoute from "./routes/docGenerator.routes.js";
import companyDocumentsRoute from "./routes/companyDocuments.routes.js";
import companyImagesRoute from "./routes/system/companyImages.routes.js";

// --- RUTAS DEL SISTEMA (SaaS) --- (SaaS = Software as a Service)
import systemCompanyRoute from "./routes/system/systemCompany.routes.js";
import systemBranchRoute from "./routes/system/systemBranch.routes.js";

// 2. IMPORTAR MIDDLEWARES
import authenticationUser from "./middlewares/authentication.middleware.js"; // Necesario para identificar el rol antes de la licencia
import { validateLicenseStatus } from "./middlewares/license.middleware.js"; // <--- EL NUEVO GUARDIÁN
import path from 'path';
import storageRoute from "./routes/storage/storage.routes.js";

const app = express();
const PORT = process.env.PORT || 3001;

dbConnection();

//Middlewares express
app.use(express.json()); //Middleware para parsear el body de la peticion JSON (Ejemplo matrix trinity helicopter)

app.use(cors()); //Middleware para permitir peticiones desde cualquier origen

// HABILITAR CARPETA PÚBLICA (LOCAL STORAGE) PARA VER LOS DOCUMENTOS EN EL NAVEGADOR
// Esto permite acceder a: http://localhost:3000/uploads/mi-archivo.pdf
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// =====================================================================
// 🟢 ZONA PÚBLICA (Sin Autenticación ni Licencia)
// =====================================================================

app.get(`/health`, (req, res) => {
    res.json([
        { message: "Server Health is running" },
        { message: "System: Delfos SaaS" }
    ]);
});

// El Login debe ser público, si no, nadie podría entrar para validar su licencia.
app.use(`/api/v1/auth`, authRoute);

// Ruta de Validación Pública de Documentos por CUD
app.use('/api/public', publicRoutes);


// =====================================================================
// 🟡 ZONA PROTEGIDA (El Muro de Pago)
// =====================================================================
// A partir de aquí, interceptamos TODO lo que vaya a /api/v1/*
// 1. authenticationUser: Decodifica el token y nos dice si es 'root', 'admin', etc.
// 2. validateLicenseStatus: Revisa si pagaron o si es 'root' para dejar escribir.

app.use('/api/v1', authenticationUser, validateLicenseStatus);


// NOTA TÉCNICA:
// Aunque tus rutas individuales (ej: users.route.js) ya tienen 'authenticationUser' dentro,
// ponerlo aquí arriba es necesario para que 'validateLicenseStatus' tenga acceso a 'req.role'.
// Relax que Express maneja esto bien; simplemente valida el token dos veces (milisegundos),
// pero te ahorra tener que reescribir todos tus archivos de rutas.


// =====================================================================
// 🔴 RUTAS DE NEGOCIO (Ya protegidas por la licencia)
// =====================================================================

// Rutas de Almacenamiento
app.use(`/api/v1/storage`, storageRoute);
app.use('/api/v1/company-images', companyImagesRoute);

// Rutas Operativas
app.use(`/api/v1/users`, usersRoute);
app.use(`/api/v1/documents`, documentsRoute);
app.use(`/api/v1/clients`, clientsRoute);
app.use(`/api/v1/generator`, docGeneratorRoute);
app.use(`/api/v1/company-documents`, companyDocumentsRoute);

// Rutas de Configuración del Sistema (SaaS)
app.use(`/api/v1/system-company`, systemCompanyRoute);
app.use(`/api/v1/system-branches`, systemBranchRoute);

// =====================================================================
// INICIO DEL SERVIDOR
// =====================================================================
app.listen(PORT, () => console.log(`🚀 Server running in SaaS Mode on http://localhost:${PORT}`));