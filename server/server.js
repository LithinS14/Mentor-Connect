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
    origin: "http://localhost:5173",
    credentials: true,
  }),
)
app.use(bodyParser.json())

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err)
    process.exit(1) // Exit the process if MongoDB connection fails
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

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

