const mongoose = require("mongoose");

const mentorSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  profilePicture: String,
  expertise: {
    type: [String],
    required: true
  },
  experience: {
    type: Number,
    required: true
  },
  bio: String,
  availability: {
    type: Map,
    of: [String]
  }
});

module.exports = mongoose.model("Mentor", mentorSchema);