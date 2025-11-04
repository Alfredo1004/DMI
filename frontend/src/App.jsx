import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// --- CONFIGURACIÓN Y CONSTANTES ---
const API_BASE_URL = 'http://localhost:5000/api';
const REFRESH_INTERVAL_MS = 5000;

// Colores primarios para el diseño oscuro (Constantes)
const COLOR_PRIMARY = '#06B6D4'; // Cyan
const COLOR_SECONDARY = '#1F2937'; // Gris oscuro para tarjetas
const COLOR_BACKGROUND = '#000000'; // Negro puro para fondo
const COLOR_TEXT = '#E5E7EB'; // Blanco para texto
const COLOR_GRAY = '#4B5563'; // Gris para bordes/líneas

// Obtener el token, rol y email de localStorage
const getToken = () => localStorage.getItem('token');
const getRole = () => localStorage.getItem('role');
const getEmail = () => localStorage.getItem('email');

// --- Estilos Base para Responsividad ---
const useViewport = () => {
    const [width, setWidth] = useState(window.innerWidth);
    useEffect(() => {
        const handleWindowResize = () => setWidth(window.innerWidth);
        window.addEventListener('resize', handleWindowResize);
        return () => window.removeEventListener('resize', handleWindowResize);
    }, []);
    return { width };
};

// Retorna los estilos de cuadrícula responsive.
const getGridStyle = (viewportWidth, numColumnsDesktop) => {
    let columns = `repeat(${numColumnsDesktop}, minmax(0, 1fr))`;
    
    // Tablet (768px)
    if (viewportWidth < 1024) {
        columns = 'repeat(2, minmax(0, 1fr))';
    }
    // Mobile (640px)
    if (viewportWidth < 640) {
        columns = 'repeat(1, minmax(0, 1fr))';
    }

    return {
        display: 'grid',
        gap: '24px',
        gridTemplateColumns: columns,
    };
};

// Estilo base para inputs
const inputStyle = {
    width: '100%',
    padding: '10px',
    borderRadius: '4px',
    backgroundColor: '#374151',
    border: `1px solid ${COLOR_GRAY}`,
    color: COLOR_TEXT,
    boxSizing: 'border-box',
};

const buttonBaseStyle = {
    color: 'white',
    fontWeight: 'bold',
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    minWidth: '150px'
};


// --- 1. COMPONENTE DE LA GRÁFICA (COMPARTIDO) ---

const RealTimeChart = ({ data }) => {
    
    const lastUpdate = data.length > 0
        ? new Date(data[data.length - 1].timestamp).toLocaleTimeString('es-ES', { hour12: false })
        : 'N/A';

    const chartContainerStyle = {
        backgroundColor: COLOR_SECONDARY,
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        borderTop: `4px solid ${COLOR_PRIMARY}`,
    };

    const chartTitleStyle = {
        fontSize: '1.25rem',
        fontWeight: 'bold',
        marginBottom: '16px',
        color: COLOR_PRIMARY,
        borderBottom: `1px solid ${COLOR_GRAY}`,
        paddingBottom: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
    };

    return (
        <div style={chartContainerStyle}>
            <div style={chartTitleStyle}>
                Monitoreo de Consumo en Tiempo Real (kWh)
                <span style={{ fontSize: '0.875rem', fontWeight: 'normal', color: COLOR_GRAY, marginTop: '4px' }}>
                    Actualización: cada {REFRESH_INTERVAL_MS / 1000} segundos
                </span>
            </div>
            
            <div style={{ height: '384px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={COLOR_GRAY} />
                        <XAxis
                            dataKey="timestamp"
                            tickFormatter={(time) => new Date(time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            stroke={COLOR_TEXT}
                        />
                        <YAxis stroke={COLOR_TEXT} label={{ value: 'Valor (kWh)', angle: -90, position: 'insideLeft', fill: COLOR_TEXT }} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1F2937', border: `1px solid ${COLOR_GRAY}`, borderRadius: '8px', color: COLOR_TEXT }}
                            labelFormatter={(label) => new Date(label).toLocaleTimeString('es-ES')}
                            formatter={(value) => [`${value.toFixed(2)} kWh`, 'Consumo']}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px', color: COLOR_TEXT }} />
                        <Line type="monotone" dataKey="valor" stroke={COLOR_PRIMARY} dot={false} strokeWidth={2} name="Consumo Eléctrico (kWh)" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <p style={{ textAlign: 'right', fontSize: '0.75rem', color: COLOR_GRAY, marginTop: '8px' }}>
                Último registro: {lastUpdate}
            </p>
        </div>
    );
};


// --- 2. WIDGETS Y DASHBOARD USER ---

/**
 * Widget de datos con diseño moderno.
 */
const DataWidget = ({ title, value, unit, icon, color, borderColor }) => {
    const widgetStyle = {
        backgroundColor: COLOR_SECONDARY,
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.4)',
        borderTop: `4px solid ${borderColor}`,
        height: '100%',
    };

    const titleStyle = {
        fontSize: '0.875rem',
        fontWeight: '600',
        color: COLOR_GRAY,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    };

    const valueStyle = {
        fontSize: '2.25rem',
        fontWeight: '800',
        marginTop: '8px',
        color: color,
        lineHeight: '1.2',
    };

    const unitStyle = {
        fontSize: '1rem',
        fontWeight: 'normal',
        color: COLOR_TEXT,
        marginLeft: '8px',
    };

    return (
        <div style={widgetStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={titleStyle}>{title}</h3>
                <span style={{ fontSize: '1.5rem', color: color }}>{icon}</span>
            </div>
            <p style={valueStyle}>
                {value}
                <span style={unitStyle}>{unit}</span>
            </p>
        </div>
    );
};

/**
 * Componente que ven solo los usuarios con rol 'user'.
 */
const UserDashboard = ({ data }) => {
    const { width } = useViewport();
    const latestValue = data.length > 0 ? data[data.length - 1].valor.toFixed(2) : '0.00';
    const lastUpdate = data.length > 0
        ? new Date(data[data.length - 1].timestamp).toLocaleTimeString('es-ES', { hour12: false })
        : 'N/A';
    
    const dashboardContainerStyle = {
        padding: width < 640 ? '16px' : '32px',
        margin: '0 auto',
        maxWidth: '1280px',
        minHeight: 'calc(100vh - 64px)',
    };
    
    return (
        <div style={dashboardContainerStyle}>
            <h1 style={{ fontSize: width < 640 ? '1.5rem' : '2rem', fontWeight: '800', color: COLOR_TEXT, textAlign: 'center', paddingBottom: '16px', borderBottom: `1px solid ${COLOR_GRAY}`, marginBottom: '32px' }}>
                Panel de Monitoreo (Acceso Limitado)
            </h1>
            
            <div style={getGridStyle(width, 3)}>
                <DataWidget 
                    title="Lectura Actual" 
                    value={latestValue} 
                    unit="kWh" 
                    icon="⚡" 
                    color={COLOR_PRIMARY} 
                    borderColor={COLOR_PRIMARY}
                />
                <DataWidget 
                    title="Última Hora de Registro" 
                    value={lastUpdate} 
                    unit="" 
                    icon="⏱️" 
                    color="#FBBF24" 
                    borderColor="#FBBF24"
                />
                <DataWidget 
                    title="Rol de Acceso" 
                    value={getRole().toUpperCase()} 
                    unit="" 
                    icon="👤" 
                    color="#10B981" 
                    borderColor="#10B981"
                />
            </div>

            <div style={{ marginTop: '32px' }}>
                <RealTimeChart data={data} />
            </div>
            
            <p style={{ textAlign: 'center', color: COLOR_GRAY, fontSize: '0.875rem', fontStyle: 'italic', paddingTop: '16px' }}>
                Tienes acceso de solo lectura a los datos de consumo.
            </p>
        </div>
    );
};


// --- 3. COMPONENTE DE ADMINISTRACIÓN DE USUARIOS (NUEVO) ---

const UserManagementPanel = () => {
    const { width } = useViewport();
    const [isRegistering, setIsRegistering] = useState(false);
    const [registerForm, setRegisterForm] = useState({ email: '', password: '', role: 'user' });
    const [registerMessage, setRegisterMessage] = useState('');
    const [registerIsError, setRegisterIsError] = useState(false);

    // Función para manejar el cambio en el formulario
    const handleRegisterChange = (e) => {
        setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
        setRegisterMessage('');
    };

    // Función de REGISTRO DE USUARIO
    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setRegisterMessage('Registrando usuario...');
        setRegisterIsError(false);

        const token = getToken();

        if (!token) {
            setRegisterMessage('Error: No autorizado para registrar usuarios.');
            setRegisterIsError(true);
            return;
        }

        try {
            // Llama a la ruta de registro del backend
            await axios.post(`${API_BASE_URL}/auth/register`, registerForm, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setRegisterMessage(`¡Usuario ${registerForm.email} registrado exitosamente!`);
            setRegisterIsError(false);
            setRegisterForm({ email: '', password: '', role: 'user' }); // Limpiar formulario
            setIsRegistering(false); // Opcional: Cerrar formulario al éxito

        } catch (error) {
            console.error('Error al registrar usuario:', error.response?.data);
            const msg = error.response?.data?.message || 'Error al registrar. Verifique los datos o si el usuario ya existe.';
            setRegisterMessage(msg);
            setRegisterIsError(true);
        }
    };
    
    const adminPanelStyle = {
        backgroundColor: COLOR_SECONDARY,
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.4)',
        border: `1px solid ${COLOR_PRIMARY}`,
        marginTop: '32px',
    };
    
    return (
        <div style={adminPanelStyle}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: COLOR_PRIMARY, marginBottom: '16px' }}>
                Administración de Usuarios
            </h3>
            
            {/* Mensaje de estado global para registro */}
            {registerMessage && (
                <div style={{ 
                    padding: '10px', 
                    marginBottom: '12px', 
                    borderRadius: '4px', 
                    fontSize: '0.875rem', 
                    fontWeight: '500',
                    backgroundColor: registerIsError ? '#450A0A' : '#064E3B', 
                    color: registerIsError ? '#FCA5A5' : '#6EE7B7'
                }}>
                    {registerMessage}
                </div>
            )}

            {/* Botón para alternar el formulario */}
            <button
                onClick={() => {
                    setIsRegistering(!isRegistering);
                    setRegisterMessage(''); // Limpiar mensajes al abrir/cerrar
                    setRegisterIsError(false);
                }}
                style={{
                    ...buttonBaseStyle,
                    backgroundColor: isRegistering ? '#FBBF24' : '#10B981', // Amarillo o Verde
                    marginRight: '16px'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = isRegistering ? '#D97706' : '#059669'}
                onMouseOut={(e) => e.target.style.backgroundColor = isRegistering ? '#FBBF24' : '#10B981'}
            >
                {isRegistering ? 'Cancelar Registro' : 'Registrar Nuevo Usuario'}
            </button>
            
            {/* Formulario de Registro de Usuario */}
            {isRegistering && (
                <div style={{ marginTop: '24px', padding: '16px', border: `1px dashed ${COLOR_GRAY}`, borderRadius: '8px' }}>
                    <h4 style={{ color: COLOR_TEXT, fontSize: '1.125rem', marginBottom: '16px' }}>
                        Crear Cuenta de Usuario
                    </h4>
                    
                    <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <input
                            type="email"
                            name="email"
                            placeholder="Email del nuevo usuario"
                            value={registerForm.email}
                            onChange={handleRegisterChange}
                            style={inputStyle}
                            required
                        />
                        <input
                            type="password"
                            name="password"
                            placeholder="Contraseña (mínimo 6 caracteres)"
                            value={registerForm.password}
                            onChange={handleRegisterChange}
                            style={inputStyle}
                            required
                            minLength="6"
                        />
                        <select
                            name="role"
                            value={registerForm.role}
                            onChange={handleRegisterChange}
                            style={inputStyle}
                        >
                            <option value="user">Usuario Estándar</option>
                            <option value="admin">Administrador</option>
                        </select>

                        <button
                            type="submit"
                            style={{
                                ...buttonBaseStyle,
                                backgroundColor: COLOR_PRIMARY,
                                marginTop: '8px'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#0E7490'}
                            onMouseOut={(e) => e.target.style.backgroundColor = COLOR_PRIMARY}
                        >
                            Confirmar Registro
                        </button>
                    </form>
                </div>
            )}

            {/* Placeholder para la tabla de gestión de usuarios (próximo paso) */}
            <div style={{ marginTop: '32px', padding: '24px', border: `1px solid ${COLOR_GRAY}`, borderRadius: '8px', color: COLOR_GRAY, textAlign: 'center' }}>
                <p>Aquí se mostrará la tabla con la lista completa de usuarios y opciones para editar/eliminar.</p>
                <p style={{ color: COLOR_PRIMARY, fontWeight: 'bold', marginTop: '8px' }}>Funcionalidad Pendiente: Listar y Administrar Usuarios</p>
            </div>
        </div>
    );
};


// --- 4. DASHBOARD DE ADMINISTRADOR (Contenedor de Pestañas) ---

const AdminDashboard = ({ data, handleLogout }) => {
    const { width } = useViewport();
    // Estado para manejar la pestaña activa: 'dashboard' o 'users'
    const [activeTab, setActiveTab] = useState('dashboard'); 
    
    const latestValue = data.length > 0 ? data[data.length - 1].valor.toFixed(2) : '0.00';
    const avgValue = useMemo(() => {
        if (data.length === 0) return '0.00';
        const sum = data.reduce((acc, item) => acc + item.valor, 0);
        return (sum / data.length).toFixed(2);
    }, [data]);
    const lastUpdate = data.length > 0
        ? new Date(data[data.length - 1].timestamp).toLocaleTimeString('es-ES', { hour12: false })
        : 'N/A';
    
    const dashboardContainerStyle = {
        padding: width < 640 ? '16px' : '32px',
        margin: '0 auto',
        maxWidth: '1280px',
        minHeight: 'calc(100vh - 64px)',
    };
    
    // Estilos de pestaña
    const TabButtonStyle = (tabName) => ({
        padding: width < 640 ? '8px 12px' : '10px 20px',
        cursor: 'pointer',
        fontWeight: '600',
        backgroundColor: activeTab === tabName ? COLOR_SECONDARY : 'transparent',
        color: activeTab === tabName ? COLOR_PRIMARY : COLOR_GRAY,
        border: activeTab === tabName ? `1px solid ${COLOR_PRIMARY}` : `1px solid ${COLOR_GRAY}`,
        borderBottom: activeTab === tabName ? 'none' : `1px solid ${COLOR_GRAY}`,
        borderRadius: '8px 8px 0 0',
        transition: 'all 0.3s ease',
    });

    const DashboardContent = (
        <>
            {/* Widgets de métricas para el administrador */}
            <div style={getGridStyle(width, 4)}>
                <DataWidget 
                    title="Lectura Actual" 
                    value={latestValue} 
                    unit="kWh" 
                    icon="⚡" 
                    color={COLOR_PRIMARY} 
                    borderColor={COLOR_PRIMARY}
                />
                <DataWidget 
                    title="Consumo Promedio" 
                    value={avgValue} 
                    unit="kWh" 
                    icon="📊" 
                    color="#10B981" // Verde
                    borderColor="#10B981"
                />
                <DataWidget 
                    title="Registros Totales" 
                    value={data.length} 
                    unit="pts" 
                    icon="📑" 
                    color="#FBBF24" // Amarillo
                    borderColor="#FBBF24"
                />
                <DataWidget 
                    title="Última Actualización" 
                    value={lastUpdate} 
                    unit="Hora" 
                    icon="⏱️" 
                    color="#EF4444" // Rojo
                    borderColor="#EF4444"
                />
            </div>

            <div style={{ marginTop: '32px' }}>
                <RealTimeChart data={data} />
            </div>
        </>
    );


    return (
        <div style={dashboardContainerStyle}>
            <h1 style={{ fontSize: width < 640 ? '1.5rem' : '2.25rem', fontWeight: '800', color: COLOR_TEXT, textAlign: 'center', borderBottom: `2px solid ${COLOR_PRIMARY}`, paddingBottom: '16px', marginBottom: '32px' }}>
                EnergiSense | Dashboard Industrial (ADMINISTRADOR)
            </h1>

            {/* Barra de Navegación por Pestañas */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${COLOR_GRAY}`, gap: '8px', marginBottom: '24px' }}>
                <button
                    style={TabButtonStyle('dashboard')}
                    onClick={() => setActiveTab('dashboard')}
                >
                    📈 Dashboard Principal
                </button>
                <button
                    style={TabButtonStyle('users')}
                    onClick={() => setActiveTab('users')}
                >
                    👥 Gestión de Usuarios
                </button>
            </div>


            {/* Contenido según la Pestaña Activa */}
            <div style={{ padding: '0px' }}>
                {activeTab === 'dashboard' && DashboardContent}
                
                {activeTab === 'users' && <UserManagementPanel />}
            </div>
            
        </div>
    );
};


// --- 5. COMPONENTE DE LOGIN Y APP PRINCIPAL ---

const Login = ({ handleLogin, message, isError }) => {
    const { width } = useViewport();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        handleLogin(email, password);
    };

    const loginContainerStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: COLOR_BACKGROUND,
        fontFamily: 'sans-serif',
        padding: '16px', 
        boxSizing: 'border-box'
    };

    const cardStyle = {
        backgroundColor: COLOR_SECONDARY,
        padding: width < 640 ? '24px' : '40px', 
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        width: '100%',
        maxWidth: '448px',
        borderTop: `8px solid ${COLOR_PRIMARY}`,
    };
    
    const inputLoginStyle = {
        width: '100%',
        padding: '12px',
        borderRadius: '8px',
        backgroundColor: '#374151',
        border: `1px solid ${COLOR_GRAY}`,
        color: COLOR_TEXT,
        boxSizing: 'border-box',
    };

    const buttonLoginStyle = {
        width: '100%',
        backgroundColor: COLOR_PRIMARY,
        color: 'white',
        fontWeight: 'bold',
        padding: '12px',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer',
        transition: 'background-color 0.3s',
        boxShadow: `0 4px 6px -1px rgba(0, 182, 212, 0.5), 0 2px 4px -2px rgba(0, 182, 212, 0.08)`,
    };


    return (
        <div style={loginContainerStyle}>
            <div style={cardStyle}>
                <h1 style={{ fontSize: width < 640 ? '1.5rem' : '1.875rem', fontWeight: '800', color: COLOR_PRIMARY, textAlign: 'center', marginBottom: '4px' }}>
                    EnergiSense | Acceso Industrial
                </h1>
                <p style={{ textAlign: 'center', color: COLOR_GRAY, marginBottom: '32px' }}>
                    Introduce tus credenciales para acceder al Dashboard.
                </p>
                
                {message && (
                    <div style={{ 
                        padding: '12px', 
                        marginBottom: '16px', 
                        borderRadius: '8px', 
                        fontSize: '0.875rem', 
                        textAlign: 'center', 
                        fontWeight: '500', 
                        backgroundColor: isError ? '#450A0A' : '#064E3B', 
                        color: isError ? '#FCA5A5' : '#6EE7B7'
                    }}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={inputLoginStyle}
                            required
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={inputLoginStyle}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        style={buttonLoginStyle}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#0E7490'}
                        onMouseOut={(e) => e.target.style.backgroundColor = COLOR_PRIMARY}
                    >
                        Iniciar Sesión
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '16px', borderTop: `1px solid ${COLOR_GRAY}` }}>
                    <p style={{ color: COLOR_GRAY, fontSize: '0.875rem', marginBottom: '4px' }}>
                        Prueba con: <strong style={{ color: COLOR_PRIMARY }}>admin@energisense.com / password123</strong>
                    </p>
                    <p style={{ color: COLOR_GRAY, fontSize: '0.875rem' }}>
                        o <strong style={{ color: '#10B981' }}>user1@energisense.com / password123</strong> (Si ya se creó)
                    </p>
                </div>
            </div>
        </div>
    );
};


const App = () => {
    const { width } = useViewport();

    const [data, setData] = useState([]);
    const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());
    const [userRole, setUserRole] = useState(getRole() || null);
    const [userEmail, setUserEmail] = useState(getEmail() || null);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);


    // Función de LOGIN
    const handleLogin = useCallback(async (email, password) => {
        try {
            const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
            
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('role', res.data.role);
            localStorage.setItem('email', res.data.email);

            setUserRole(res.data.role);
            setUserEmail(res.data.email);
            setIsAuthenticated(true);
            setMessage('¡Inicio de sesión exitoso!');
            setIsError(false);

        } catch (error) {
            console.error('Error de login:', error);
            const msg = error.response?.data?.message || error.response?.data?.msg || 'Credenciales inválidas o error de red.';
            setMessage(msg);
            setIsError(true);
        }
    }, []);

    // Función de LOGOUT
    const handleLogout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('email');
        setIsAuthenticated(false);
        setUserRole(null);
        setUserEmail(null);
        setData([]); 
        setMessage('Sesión cerrada correctamente.');
        setIsError(false);
    }, []);


    // Función para OBTENER DATOS PROTEGIDOS
    const fetchData = useCallback(async () => {
        const token = getToken();
        if (!token) return; 

        try {
            const res = await axios.get(`${API_BASE_URL}/data/latest`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setData(res.data);
            
        } catch (error) {
            console.error('Error al obtener datos en tiempo real:', error.message);
            
            if (error.response && error.response.status === 401) {
                setMessage('Sesión expirada o no autorizada. Redirigiendo a Login...');
                setIsError(true);
                handleLogout(); 
            }
        }
    }, [handleLogout]);
    

    // 1. Efecto para manejar la obtención de datos periódica
    useEffect(() => {
        let interval;
        if (isAuthenticated) {
            fetchData(); 
            interval = setInterval(fetchData, REFRESH_INTERVAL_MS);
        }
        
        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [isAuthenticated, fetchData]);

    
    // 2. Efecto para crear un usuario de prueba con rol 'user' (al loguearse el admin)
    useEffect(() => {
        const createUser = async (email, password) => {
             const adminToken = getToken();
             if (!adminToken || getRole() !== 'admin') return;

             try {
                // Llama al registro para crear el usuario 'user' si no existe.
                await axios.post(`${API_BASE_URL}/auth/register`, { 
                    email: email, 
                    password: password, 
                    role: 'user' 
                }, {
                    headers: { 'Authorization': `Bearer ${adminToken}` }
                });
                console.log(`Usuario de prueba (${email}) creado.`);
            } catch (error) {
                // 400 (Bad Request) es la respuesta esperada si el usuario ya existe.
                if (error.response?.status !== 400) {
                     console.error(`Error al intentar crear usuario de prueba ${email}:`, error.message);
                }
            }
        };

        if (userRole === 'admin') {
            createUser('user1@energisense.com', 'password123');
        }
    }, [userRole]);


    // RENDERIZADO PRINCIPAL
    if (!isAuthenticated) {
        return <Login handleLogin={handleLogin} message={message} isError={isError} />;
    }

    // Header del Dashboard (visible para ambos roles)
    const HeaderStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#000000',
        padding: width < 640 ? '12px 16px' : '16px 32px', // Padding responsive
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
        borderBottom: `1px solid ${COLOR_GRAY}`,
    };

    const logoStyle = {
        fontSize: width < 640 ? '1.2rem' : '1.5rem',
        fontWeight: 'bold',
        color: COLOR_TEXT,
    };

    const cyanTextStyle = {
        color: COLOR_PRIMARY,
    };

    const userInfoStyle = {
        color: COLOR_GRAY,
        fontSize: width < 640 ? '0.75rem' : '0.875rem',
        marginRight: '16px',
        display: width < 640 ? 'none' : 'inline', // Ocultar email/rol en móvil
    };
    
    const logoutButtonStyle = {
        backgroundColor: '#EF4444', 
        color: 'white',
        fontSize: width < 640 ? '0.75rem' : '0.875rem',
        fontWeight: '600',
        padding: width < 640 ? '4px 8px' : '6px 12px', 
        borderRadius: '9999px', 
        border: 'none',
        cursor: 'pointer',
        transition: 'background-color 0.3s',
    };

    const DashboardHeader = (
        <header style={HeaderStyle}>
            <h2 style={logoStyle}>
                <span style={cyanTextStyle}>EnergiSense</span> | Monitoreo
            </h2>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={userInfoStyle}>
                    {userEmail} (<span style={cyanTextStyle}>{userRole?.toUpperCase()}</span>)
                </span>
                <button
                    onClick={handleLogout}
                    style={logoutButtonStyle}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#DC2626'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#EF4444'}
                >
                    Cerrar Sesión
                </button>
            </div>
        </header>
    );

    return (
        <div style={{ minHeight: '100vh', backgroundColor: COLOR_BACKGROUND, fontFamily: 'sans-serif' }}>
            {DashboardHeader}
            
            {/* LÓGICA DE ROL */}
            {userRole === 'admin' ? (
                <AdminDashboard data={data} handleLogout={handleLogout} />
            ) : (
                <UserDashboard data={data} handleLogout={handleLogout} />
            )}
        </div>
    );
};

export default App;
