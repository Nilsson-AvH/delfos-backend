const createContract = (req, res) => {
    res.json({ msg: "Contract created" });
}

const getAllContracts = (req, res) => {
    res.json({ msg: "All contracts" });
}

const getContractById = (req, res) => {
    res.json({ msg: "Contract by id" });
}

const updateContractById = (req, res) => {
    res.json({ msg: "Contract updated by id" });
}

const deleteContractById = (req, res) => {
    res.json({ msg: "Contract deleted by id" });
}

export {
    createContract,
    getAllContracts,
    getContractById,
    updateContractById,
    deleteContractById
}
