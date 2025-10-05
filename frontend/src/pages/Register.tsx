import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
} from "@mui/material"
import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

const Register: React.FC = () => {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    language_preference: "en",
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const userId = await register({
        name: formData.name,
        email: formData.email,
        role: "seller",
      })
      // Navigate to voice training page
      navigate(`/voice-training/${userId}`)
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Registration failed. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Register for nAnalyzer
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mb: 3 }}
          >
            Create your account to start analyzing sales calls
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              margin="normal"
              autoFocus
            />

            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              margin="normal"
            />

            <TextField
              fullWidth
              label="Preferred Language"
              name="language_preference"
              value={formData.language_preference}
              onChange={handleChange}
              select
              SelectProps={{ native: true }}
              margin="normal"
              helperText="Select your primary language for transcription"
            >
              <option value="en">English</option>
              <option value="ru">Russian</option>
            </TextField>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>

            <Typography variant="body2" color="text.secondary" align="center">
              Already have an account?{" "}
              <Button
                variant="text"
                size="small"
                onClick={() => navigate("/login")}
              >
                Sign In
              </Button>
            </Typography>
          </form>
        </Paper>
      </Box>
    </Container>
  )
}

export default Register
