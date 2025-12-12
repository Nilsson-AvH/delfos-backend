import jwt from "jsonwebtoken";

const generateToken = (payload) => {
    const token = jwt.sign(
        payload, // Carga util para generar el token
        process.env.JWT_SEED,//process.env.JWT_SECRET,// Palabra secreta o Clave secreta
        // Opciones de configuracion del token
        {
            expiresIn: '1h'
        }
    );
    console.info(token);
    return token;
}

const verifyToken = (token) => {
    return jwt.verify(
        token,    // Token a verificar
        process.env.JWT_SEED // Clave secreta
    );
}

export {
    generateToken,
    verifyToken
}

