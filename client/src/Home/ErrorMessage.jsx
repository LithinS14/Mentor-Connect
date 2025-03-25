"use client"
import "./ErrorMessage.css"

const ErrorMessage = ({ message }) => {
  return (
    <div className="error-container">
      <div className="error-icon">⚠️</div>
      <h3>Something went wrong</h3>
      <p>{message}</p>
      <button onClick={() => window.location.reload()} className="retry-button">
        Try Again
      </button>
    </div>
  )
}

export default ErrorMessage

