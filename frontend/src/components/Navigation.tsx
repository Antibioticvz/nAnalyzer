import { Button } from "@mui/material"
import React from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

const Navigation: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuth()

  const isActive = (path: string) => location.pathname === path

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <nav className="navigation">
      <div className="nav-brand">🎙️ nAnalyzer</div>
      <ul className="nav-links">
        {isAuthenticated ? (
          <>
            <li>
              <Link
                to="/"
                className={`nav-link ${isActive("/") ? "active" : ""}`}
              >
                📊 Dashboard
              </Link>
            </li>
            <li>
              <Link
                to="/live"
                className={`nav-link ${isActive("/live") ? "active" : ""}`}
              >
                🔴 Live Monitoring
              </Link>
            </li>
            <li>
              <Link
                to="/history"
                className={`nav-link ${isActive("/history") ? "active" : ""}`}
              >
                📚 Call History
              </Link>
            </li>
            <li>
              <Link
                to="/analytics"
                className={`nav-link ${isActive("/analytics") ? "active" : ""}`}
              >
                📈 Analytics
              </Link>
            </li>
            <li>
              <Link
                to="/settings"
                className={`nav-link ${isActive("/settings") ? "active" : ""}`}
              >
                ⚙️ Settings
              </Link>
            </li>
            <li>
              <Link
                to="/voice-verification"
                className={`nav-link ${
                  isActive("/voice-verification") ? "active" : ""
                }`}
              >
                🧪 Test My Model
              </Link>
            </li>
            <li>
              <Link
                to={
                  user
                    ? `/voice-training/${user.user_id}`
                    : "/voice-training/me"
                }
                className={`nav-link ${
                  location.pathname.startsWith("/voice-training")
                    ? "active"
                    : ""
                }`}
              >
                🎤 Voice Training
              </Link>
            </li>
            <li className="nav-user">
              <span className="nav-user-info">👤 {user?.name || "User"}</span>
              <Button
                variant="outlined"
                size="small"
                onClick={handleLogout}
                sx={{ ml: 1, color: "white", borderColor: "white" }}
              >
                Logout
              </Button>
            </li>
          </>
        ) : (
          <>
            <li>
              <Link
                to="/login"
                className={`nav-link ${isActive("/login") ? "active" : ""}`}
              >
                🔐 Login
              </Link>
            </li>
            <li>
              <Link
                to="/register"
                className={`nav-link ${isActive("/register") ? "active" : ""}`}
              >
                👤 Register
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  )
}

export default Navigation
