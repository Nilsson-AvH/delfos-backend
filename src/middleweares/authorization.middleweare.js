const authorizationUser = (req, res, next) => {
    console.log("Autorizando usuario con middleweare...");
    next();
};

export default authorizationUser;
