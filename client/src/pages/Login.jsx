import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  Stack,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", form);
      if (response.data?.token) {
        login({ token: response.data.token, user: response.data.user });
        navigate("/", { replace: true });
      } else {
        setError("Login failed");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card elevation={3}>
        <CardHeader title="Login" subheader="IDEAIL ERP" />
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                label="Username"
                name="username"
                value={form.username}
                onChange={handleChange}
                fullWidth
                required
              />
              <TextField
                label="Password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                fullWidth
                required
              />
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? "Signing in..." : "Login"}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}
