import bcrypt from 'bcrypt';
// Encriptar la contraseña
const encryptPassword = (passwordUser) => {
    const salt = bcrypt.genSaltSync(); // Generer un framento aleatorio

    console.log(salt);

    // Combinar la clave del usuario con el salt
    const hashPassword = bcrypt.hashSync(
        passwordUser, // La contreseña del usuario sin encriptar
        salt // El fragmento aleatorio
    );

    return hashPassword; // Devuelve la contreseña del usuario encriptada
};

// Verificar comprarar la contraseña
const verifyEncryptedPassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

export {
    encryptPassword,
    verifyEncryptedPassword
}
