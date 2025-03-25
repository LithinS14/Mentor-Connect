const express = require("express");
const Mentor = require("../models/Mentor");
const router = express.Router();

// Mentor Sign In Section
router.post("/signin", async (req, res) => {
const { email, password } = req.body;

try {
const mentor = await Mentor.findOne({ email });

if (!mentor || mentor.password !== password) {
    return res.status(400).json({ error: "Invalid credentials" });
}

res.status(200).json({ message: "Mentor signed in successfully" });
} catch (err) {
res.status(400).json({ error: err.message });
}
});

module.exports = router;