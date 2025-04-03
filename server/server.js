const express = require("express")
const mongoose = require("mongoose")
const bodyParser = require("body-parser")
const cors = require("cors")
const dotenv = require("dotenv")

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Updated CORS configuration to allow credentials
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  }),
)
app.use(bodyParser.json())

// MongoDB Connection with retry logic
const connectDB = async (retryCount = 5) => {
  try {
    if (!process.env.MONGO_URI) {
      console.error("MONGO_URI environment variable is not set")
      process.exit(1)
    }

    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log("MongoDB Connected Successfully")
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`)

    if (retryCount > 0) {
      console.log(`Retrying connection... (${retryCount} attempts left)`)
      setTimeout(() => connectDB(retryCount - 1), 5000) // Wait 5 seconds before retrying
    } else {
      console.error("Failed to connect to MongoDB after multiple attempts")
      process.exit(1)
    }
  }
}

// Connect to MongoDB
connectDB()

// Handle MongoDB connection errors after initial connection
mongoose.connection.on("error", (err) => {
  console.error(`MongoDB connection error: ${err.message}`)
})

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected. Attempting to reconnect...")
  connectDB(3) // Try to reconnect with 3 retries
})

// Routes
const studentAuthRoutes = require("./routes/studentauth")
const mentorAuthRoutes = require("./routes/mentorAuth")
const studentHomeRoutes = require("./routes/studentHome")
const meetingsRoutes = require("./routes/meetings") // Add the new meetings route

app.use("/api/student", studentAuthRoutes)
app.use("/api/mentor", mentorAuthRoutes)
app.use("/api/studentHome", studentHomeRoutes)
app.use("/api/meetings", meetingsRoutes) // Register the meetings route

// Debug route to check if server is running
app.get("/", (req, res) => {
  res.send("MentorConnect API is running")
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    error: "Server error",
    message: process.env.NODE_ENV === "development" ? err.message : "An unexpected error occurred",
  })
})

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason)
  // Don't crash the server, just log the error
})

