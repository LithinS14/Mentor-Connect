"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "./Auth.css"
import "../Home/ErrorStyles.css"

const StudentAuth = () => {
  const [isSignUp, setIsSignUp] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [generalError, setGeneralError] = useState("")

  const clearErrors = () => {
    setGeneralError("")
  }

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp)
    clearErrors()
  }

  return (
    <div className="auth-container">
      <div className={`auth-content ${!isSignUp ? "sign-in" : ""}`}>
        <h1>{isSignUp ? "Student Sign Up" : "Student Sign In"}</h1>
        {generalError && <div className="error-message general-error">{generalError}</div>}
        {isSignUp ? (
          <StudentSignUp setGeneralError={setGeneralError} setIsLoading={setIsLoading} isLoading={isLoading} />
        ) : (
          <StudentSignIn setGeneralError={setGeneralError} setIsLoading={setIsLoading} isLoading={isLoading} />
        )}
        <div className="auth-toggle">
          <p>
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
            <button onClick={toggleAuthMode} className="toggle-auth" disabled={isLoading}>
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

const StudentSignIn = ({ setGeneralError, setIsLoading, isLoading }) => {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleSignIn = async (e) => {
    e.preventDefault()
    setError("")
    setGeneralError("")
    setIsLoading(true)

    try {
      // Validate inputs
      if (!email.trim() || !password.trim()) {
        throw new Error("Please enter both email and password")
      }

      // Step 1: Sign in and get studentId
      const response = await fetch("http://localhost:5000/api/student/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Sign in failed. Please check your credentials.")
      }

      // Store student ID in localStorage
      if (data.studentId) {
        localStorage.setItem("studentId", data.studentId)
        localStorage.setItem("studentEmail", email) // Store email for later use

        // Step 2: Fetch complete student profile
        try {
          const profileResponse = await fetch(`http://localhost:5000/api/studentHome/student/${data.studentId}`)

          if (profileResponse.ok) {
            const profileData = await profileResponse.json()
            // Store complete student profile in localStorage
            localStorage.setItem("studentProfile", JSON.stringify(profileData))
          } else {
            console.warn("Could not fetch student profile, but continuing with sign in")
          }
        } catch (profileError) {
          console.error("Error fetching student profile:", profileError)
          // Continue even if profile fetch fails
        }

        navigate("/student-home")
      } else {
        throw new Error("Student ID not returned from server")
      }
    } catch (error) {
      console.error("Error during sign in:", error)
      setError(error.message || "An error occurred during sign in")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSignIn}>
      {error && <div className="error-message">{error}</div>}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={isLoading}
        required
      />
      <button type="submit" className="submit-btn" disabled={isLoading}>
        {isLoading ? "Signing In..." : "Sign In"}
      </button>
    </form>
  )
}

const StudentSignUp = ({ setGeneralError, setIsLoading, isLoading }) => {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [age, setAge] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [educationLevel, setEducationLevel] = useState("")
  const [currentSchool, setCurrentSchool] = useState("")
  const [goals, setGoals] = useState("")
  const [areasOfInterest, setAreasOfInterest] = useState([])
  const [otherInterest, setOtherInterest] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const interestAreas = [
    "Web Development",
    "Mobile Development",
    "DevOps",
    "AI/Machine Learning",
    "Web3/Blockchain",
    "Data Science",
    "Cybersecurity",
    "UI/UX Design",
    "Finance",
    "Marketing",
    "Project Management",
    "Other",
  ]

  const handleInterestChange = (area) => {
    if (areasOfInterest.includes(area)) {
      setAreasOfInterest(areasOfInterest.filter((item) => item !== area))
    } else {
      setAreasOfInterest([...areasOfInterest, area])
    }
  }

  const validateForm = () => {
    // Check required fields
    if (
      !firstName.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim() ||
      !age ||
      !phoneNumber.trim() ||
      !educationLevel ||
      !currentSchool.trim() ||
      !goals.trim()
    ) {
      setError("Please fill in all required fields")
      return false
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address")
      return false
    }

    // Check password length
    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      return false
    }

    // Check password match
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return false
    }

    // Validate age
    if (isNaN(age) || Number.parseInt(age) < 13 || Number.parseInt(age) > 100) {
      setError("Please enter a valid age between 13 and 100")
      return false
    }

    // Check areas of interest
    if (areasOfInterest.length === 0) {
      setError("Please select at least one area of interest")
      return false
    }

    // Check other interest if "Other" is selected
    if (areasOfInterest.includes("Other") && !otherInterest.trim()) {
      setError("Please specify your other interest")
      return false
    }

    return true
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setGeneralError("")

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    const formData = {
      firstName,
      lastName,
      email,
      password,
      age: Number.parseInt(age),
      phoneNumber,
      educationLevel,
      currentSchool,
      goals,
      areasOfInterest: areasOfInterest.includes("Other")
        ? [...areasOfInterest.filter((area) => area !== "Other"), otherInterest]
        : areasOfInterest,
    }

    try {
      const response = await fetch("http://localhost:5000/api/student/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      if (response.ok) {
        setSuccess("Sign up successful! You can now sign in.")
        // Reset form
        setFirstName("")
        setLastName("")
        setEmail("")
        setPassword("")
        setConfirmPassword("")
        setAge("")
        setPhoneNumber("")
        setEducationLevel("")
        setCurrentSchool("")
        setGoals("")
        setAreasOfInterest([])
        setOtherInterest("")
      } else {
        setError(data.error || "Sign up failed")
      }
    } catch (error) {
      console.error("Error during sign up:", error)
      setError("An error occurred during sign up. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className="signup-form" onSubmit={handleSignUp}>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      <input
        type="text"
        placeholder="First Name"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        disabled={isLoading}
        required
      />
      <input
        type="text"
        placeholder="Last Name"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        disabled={isLoading}
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading}
        required
      />
      <input
        type="password"
        placeholder="Create Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={isLoading}
        required
      />
      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        disabled={isLoading}
        required
      />
      <input
        type="number"
        placeholder="Age"
        value={age}
        onChange={(e) => setAge(e.target.value)}
        disabled={isLoading}
        required
      />
      <input
        type="tel"
        placeholder="Phone Number"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        disabled={isLoading}
        required
      />
      <select value={educationLevel} onChange={(e) => setEducationLevel(e.target.value)} disabled={isLoading} required>
        <option value="">Select Education Level</option>
        <option value="high_school">High School</option>
        <option value="bachelors">Bachelor's Degree</option>
        <option value="masters">Master's Degree</option>
        <option value="phd">Ph.D.</option>
      </select>
      <input
        type="text"
        placeholder="Current School/University"
        value={currentSchool}
        onChange={(e) => setCurrentSchool(e.target.value)}
        disabled={isLoading}
        required
      />
      <div className="description-section">
        <textarea
          placeholder="Brief description of your goals and what you hope to achieve through mentorship"
          value={goals}
          onChange={(e) => setGoals(e.target.value)}
          rows="4"
          disabled={isLoading}
          required
        ></textarea>
      </div>
      <div className="interest-section">
        <label>Areas of Interest (Select multiple):</label>
        <div className="interest-options">
          {interestAreas.map((area) => (
            <label key={area} className="interest-option">
              <input
                type="checkbox"
                checked={areasOfInterest.includes(area)}
                onChange={() => handleInterestChange(area)}
                disabled={isLoading}
              />
              {area}
            </label>
          ))}
        </div>
        {areasOfInterest.includes("Other") && (
          <input
            type="text"
            placeholder="Specify your interest"
            value={otherInterest}
            onChange={(e) => setOtherInterest(e.target.value)}
            disabled={isLoading}
            required
            className="other-input"
          />
        )}
      </div>
      <button type="submit" className="submit-btn" disabled={isLoading}>
        {isLoading ? "Signing Up..." : "Sign Up"}
      </button>
    </form>
  )
}

export default StudentAuth

