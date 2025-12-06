import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
    res.json({ message: "Clients route" });
});

router.post("/", (req, res) => {
    res.json({ message: "Clients route" });
});

router.get("/:id", (req, res) => {
    res.json({ message: "Clients route" });
});

router.patch("/:id", (req, res) => {
    res.json({ message: "Clients route" });
});

router.delete("/:id", (req, res) => {
    res.json({ message: "Clients route" });
});

export default router;