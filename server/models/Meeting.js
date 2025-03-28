const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema({
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Mentor",
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  topic: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "scheduled", "completed", "cancelled", "rejected"],
    default: "pending",
  },
  cancellationReason: String,
  cancelledAt: Date,
  actualDuration: Number,
});

module.exports = mongoose.model("Meeting", meetingSchema);