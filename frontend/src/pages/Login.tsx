import {
  Alert,
  Box,
  Button,
  Container,
  Link as MuiLink,
  Paper,
  TextField,
  Typography,
} from "@mui/material"
import React, { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

const Login: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [userId, setUserId] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const from = location.state?.from?.pathname || "/"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await login(userId)
      navigate(from, { replace: true })
    } catch (err: any) {
      setError(
        err.response?.data?.detail?.message ||
          "Пользователь не найден. Проверьте ID или зарегистрируйтесь."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom align="center">
            Вход в nAnalyzer
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            align="center"
            sx={{ mb: 3 }}
          >
            Введите ваш ID пользователя для входа
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              label="ID пользователя"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              fullWidth
              required
              placeholder="user_1f61bd63f82f4656"
              sx={{ mb: 3 }}
              helperText="ID был предоставлен при регистрации"
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading || !userId.trim()}
              sx={{ mb: 2 }}
            >
              {loading ? "Вход..." : "Войти"}
            </Button>
          </Box>

          <Box sx={{ textAlign: "center", mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Нет аккаунта?{" "}
              <MuiLink
                component={Link}
                to="/register"
                sx={{ textDecoration: "none" }}
              >
                Зарегистрироваться
              </MuiLink>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export default Login
