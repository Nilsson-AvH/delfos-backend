import jwt from "jsonwebtoken"; // Asegúrate de haber instalado: npm install jsonwebtoken

const secret = process.env.JWT_SEED;

const generateToken = (payload) => {
    const token = jwt.sign(
        payload, // Carga util para generar el token
        secret,
        // process.env.JWT_SEED, // Palabra secreta o Clave secreta
        // Opciones de configuracion del token
        {
            expiresIn: '8h' // Expiracion del token le puse 8 horas para pruebas
        }
    );
    console.info(token);
    return token;
}

const verifyToken = (token) => {
    return jwt.verify(
        token,    // Token a verificar
        secret //process.env.JWT_SEED // Clave secreta
    );
}

export {
    generateToken,
    verifyToken
}