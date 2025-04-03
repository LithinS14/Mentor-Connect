"use client"

import React from "react"

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service
    console.error("Error caught by ErrorBoundary:", error, errorInfo)
    this.setState({
      error: error,
      errorInfo: errorInfo,
    })
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div
          style={{
            padding: "20px",
            margin: "20px",
            backgroundColor: "#fff5f5",
            border: "1px solid #fed7d7",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <h2 style={{ color: "#e53e3e" }}>Something went wrong</h2>
          <p>We're sorry, but an error occurred while rendering this component.</p>
          <details
            style={{
              whiteSpace: "pre-wrap",
              margin: "10px",
              padding: "10px",
              backgroundColor: "#f8f9fa",
              borderRadius: "4px",
              textAlign: "left",
            }}
          >
            <summary>Show error details</summary>
            <p>{this.state.error && this.state.error.toString()}</p>
            <p>Component Stack:</p>
            <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: "#4f46e5",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              marginTop: "15px",
            }}
          >
            Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

