const mongoose = require("mongoose");

const mentorSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  profilePicture: String,
  yearsOfExperience: Number,
  areasOfInterest: [String],
  bio: String,
});

module.exports = mongoose.model("Mentor", mentorSchema);