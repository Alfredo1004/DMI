import { useState, useEffect } from 'react';
import { useAuth } from './App.jsx'; // Se mantiene la extensión, pero revisamos la lógica de importación en el hook useAuth
import axios from 'axios';
import {
    Container, Typography, Button, Box, Alert, Card, CardContent, CircularProgress,
    Grid, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ListIcon from '@mui/icons-material/List';

const API_USERS_URL = 'http://localhost:5000/api/admin/users';
const API_REGISTER_URL = 'http://localhost:5000/api/auth/register';

function AdminPanel() {
    // Obtener el estado del usuario y el token del contexto de autenticación
    const { user, token } = useAuth(); 
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [registerFormData, setRegisterFormData] = useState({
        email: '',
        password: '',
        role: 'user', // Por defecto crea un usuario normal
    });
    const [registerStatus, setRegisterStatus] = useState(null); // success | error
    const [registerMessage, setRegisterMessage] = useState('');

    /**
     * Función para obtener la lista de todos los usuarios del backend.
     * Requiere el token del administrador en el header 'x-auth-token'.
     */
    const fetchUsers = async () => {
        setLoading(true);
        try {
            // El token se obtiene del contexto, que a su vez lo saca del localStorage
            const response = await axios.get(API_USERS_URL, {
                headers: { 'x-auth-token': token },
            });
            setUsers(response.data);
        } catch (err) {
            console.error('Error al cargar usuarios:', err);
            // Manejo de errores de acceso o conexión
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    // Efecto para cargar los usuarios al montar el componente (si el usuario es admin)
    useEffect(() => {
        if (user && user.role === 'admin' && token) {
            fetchUsers();
        }
    }, [user, token]);

    // Maneja el cambio en los campos del formulario de registro
    const handleRegisterChange = (e) => {
        setRegisterFormData({
            ...registerFormData,
            [e.target.name]: e.target.value,
        });
    };

    /**
     * Función para enviar la solicitud de registro de un nuevo usuario.
     * Requiere el token del administrador para la autorización.
     */
    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setRegisterStatus(null);
        setRegisterMessage('');

        try {
            await axios.post(API_REGISTER_URL, registerFormData, {
                headers: { 'x-auth-token': token },
            });
            
            setRegisterStatus('success');
            setRegisterMessage(`Usuario ${registerFormData.email} creado exitosamente.`);
            setRegisterFormData({ email: '', password: '', role: 'user' }); // Limpiar formulario
            fetchUsers(); // Actualizar la lista después de crear
        } catch (err) {
            setRegisterStatus('error');
            setRegisterMessage(err.response?.data?.msg || 'Error al crear usuario.');
        }
    };

    // Bloqueo de acceso si el usuario no tiene rol de administrador
    if (!user || user.role !== 'admin') {
        return (
            <Container maxWidth="md" sx={{ mt: 5 }}>
                <Alert severity="error">Acceso Denegado. Solo los administradores pueden acceder a este panel.</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ pt: 4, pb: 4, minHeight: '100vh', backgroundColor: '#f4f7f9' }}>
            <Box sx={{ textAlign: 'center', mb: 5 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 800, color: '#4f46e5' }}>
                    Panel de Administración
                </Typography>
                <Typography variant="subtitle1" color="textSecondary">
                    Gestión de usuarios del sistema EnergiSense
                </Typography>
            </Box>

            <Grid container spacing={4}>
                {/* Panel de Creación de Usuarios */}
                <Grid item xs={12} md={5}>
                    <Card sx={{ boxShadow: 5, mb: 3, borderRadius: '8px' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={2}>
                                <PersonAddIcon color="primary" sx={{ mr: 1 }} />
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>Crear Nuevo Usuario</Typography>
                            </Box>
                            
                            {registerStatus && (
                                <Alert severity={registerStatus} sx={{ mb: 2 }}>{registerMessage}</Alert>
                            )}

                            <Box component="form" onSubmit={handleRegisterSubmit}>
                                <TextField
                                    label="Email"
                                    name="email"
                                    type="email"
                                    fullWidth
                                    margin="normal"
                                    value={registerFormData.email}
                                    onChange={handleRegisterChange}
                                    required
                                />
                                <TextField
                                    label="Contraseña"
                                    name="password"
                                    type="password"
                                    fullWidth
                                    margin="normal"
                                    value={registerFormData.password}
                                    onChange={handleRegisterChange}
                                    required
                                />
                                {/* Selector de Rol */}
                                <TextField
                                    label="Rol (user o admin)"
                                    name="role"
                                    select
                                    fullWidth
                                    margin="normal"
                                    value={registerFormData.role}
                                    onChange={handleRegisterChange}
                                    SelectProps={{ native: true }}
                                >
                                    <option value="user">user</option>
                                    <option value="admin">admin</option>
                                </TextField>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    sx={{ mt: 3, py: 1.5, bgcolor: '#4f46e5', '&:hover': { bgcolor: '#3730a3' } }}
                                >
                                    Crear Usuario
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Lista de Usuarios */}
                <Grid item xs={12} md={7}>
                    <Card sx={{ boxShadow: 5, borderRadius: '8px' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={2}>
                                <ListIcon color="primary" sx={{ mr: 1 }} />
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>Lista de Usuarios</Typography>
                            </Box>

                            {loading ? (
                                <Box display="flex" justifyContent="center" py={5}>
                                    <CircularProgress />
                                </Box>
                            ) : (
                                <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
                                    <Table stickyHeader>
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                                                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Rol</TableCell>
                                                <TableCell sx={{ fontWeight: 700, display: { xs: 'none', sm: 'table-cell' } }}>ID (MongoDB)</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {users.map((u) => (
                                                <TableRow key={u._id} hover>
                                                    <TableCell>{u.email}</TableCell>
                                                    <TableCell>{u.role}</TableCell>
                                                    <TableCell sx={{ fontSize: '0.75rem', display: { xs: 'none', sm: 'table-cell' } }}>{u._id}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
}

export default AdminPanel;
