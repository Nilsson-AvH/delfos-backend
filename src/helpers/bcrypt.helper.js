import bcrypt from 'bcryptjs'; // Asegúrate de haber instalado: npm install bcryptjs

// Encriptar la contraseña
const encryptPassword = (passwordUser) => {
    const salt = bcrypt.genSaltSync(); // Generer un framento aleatorio

    //console.log(salt);

    // Combinar la clave del usuario con el salt
    const hashPassword = bcrypt.hashSync(
        passwordUser, // La contreseña del usuario sin encriptar
        salt // El fragmento aleatorio
    );

    return hashPassword; // Devuelve la contreseña del usuario encriptada
};

// Verificar comprarar la contraseña
const verifyEncryptedPassword = async (originalPassword, hashPassword) => {
    return await bcrypt.compare(
        originalPassword, // password original que viene del body
        hashPassword // la contreseña del usuario encriptada
    );
};

export {
    encryptPassword,
    verifyEncryptedPassword
}