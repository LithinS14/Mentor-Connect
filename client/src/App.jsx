import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import LandingPage from "./components/LandingPage"
import UserSelection from "./components/UserSelection"
import StudentAuth from "./auth/StudentAuth"
import MentorAuth from "./auth/MentorAuth"
import StudentHome from "./Home/StudentHome"
import MentorHome from ".//Home/MentorHome"
import "./App.css"
import ErrorBoundary from "./Home/ErrorBoundary"

const App = () => {
  return (
    <ErrorBoundary>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/user-selection" element={<UserSelection />} />
            <Route path="/student" element={<StudentAuth />} />
            <Route path="/mentor" element={<MentorAuth />} />
            <Route path="/student-home" element={<StudentHome />} />
            <Route path="/mentor-home" element={<MentorHome />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  )
}

export default App

