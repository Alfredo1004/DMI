import { useState } from 'react';
import { useAuth } from './App.jsx'; // FIX: Se agregó la extensión .jsx para resolver el error de compilación
import {
    Container, Typography, TextField, Button, Box, Alert, Card, CardContent, CircularProgress
} from '@mui/material';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth/login';

function Login() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // Nota: Se asume que login en App.jsx toma el token y el rol
            const response = await axios.post(API_URL, { email, password });
            
            // Si el login es exitoso, llama a la función de contexto, pasando email, rol y token
            login(response.data.token, response.data.role, response.data.email); // Asegurando que pasamos el email

        } catch (err) {
            console.error('Error de inicio de sesión:', err);
            setError(err.response?.data?.msg || 'Credenciales inválidas. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f7f9' }}>
            <Card sx={{ boxShadow: 8, width: '100%', p: 4, borderRadius: '10px' }}>
                <CardContent>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <LockOpenIcon sx={{ m: 1, color: '#4f46e5', fontSize: 40 }} />
                        <Typography component="h1" variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                            Iniciar Sesión
                        </Typography>
                        <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 3 }}>
                            EnergiSense Dashboard
                        </Typography>

                        {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}

                        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="email"
                                label="Correo Electrónico"
                                name="email"
                                autoComplete="email"
                                autoFocus
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label="Contraseña"
                                type="password"
                                id="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                sx={{ mt: 3, mb: 2, py: 1.5, bgcolor: '#4f46e5', '&:hover': { bgcolor: '#3730a3' } }}
                                disabled={loading}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Acceder'}
                            </Button>
                        </Box>
                        
                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                            <Typography variant="body2" color="textSecondary">
                                Admin de prueba: 
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                admin@energisense.com / password123
                            </Typography>
                        </Box>

                    </Box>
                </CardContent>
            </Card>
        </Container>
    );
}

export default Login;
