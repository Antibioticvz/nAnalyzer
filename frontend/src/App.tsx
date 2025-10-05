import { Route, BrowserRouter as Router, Routes } from "react-router-dom"
import "./App.css"

// Pages (to be created)
import Analytics from "./pages/Analytics"
import CallDetails from "./pages/CallDetails"
import CallHistory from "./pages/CallHistory"
import Dashboard from "./pages/Dashboard"
import LiveMonitoring from "./pages/LiveMonitoring"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Settings from "./pages/Settings"
import VoiceTraining from "./pages/VoiceTraining"

// Layout components
import Navigation from "./components/Navigation"
import ProtectedRoute from "./components/ProtectedRoute"

function App() {
  return (
    <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <div className="App">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/voice-training/:userId" element={<VoiceTraining />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/live"
              element={
                <ProtectedRoute>
                  <LiveMonitoring />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <CallHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calls/:id"
              element={
                <ProtectedRoute>
                  <CallDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
