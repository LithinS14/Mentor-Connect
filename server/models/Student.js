const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema({
firstName: { type: String, required: true },
lastName: { type: String },
email: { type: String, required: true, unique: true },
password: { type: String, required: true },
age: { type: Number, required: true },
phoneNumber: { type: String, required: true },
educationLevel: { type: String, required: true },
currentSchool: { type: String, required: true },
goals: { type: String, required: true },
areasOfInterest: { type: [String], required: true },
otherInterest: { type: String },
});

module.exports = mongoose.model("Student", StudentSchema);