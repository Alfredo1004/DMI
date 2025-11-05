/*
* =======================================================================
* APLICACIÓN PRINCIPAL ENERGISENSE (DashboardApp)
* Versión: 4.0 (Home Page + App Funcional Integrada)
* Estilo: CSS-in-JS (Sin dependencias externas de CSS)
* =======================================================================
*/

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import axios from 'axios'; // Mantenemos axios para la App
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'; // Mantenemos recharts para la App

/*
* =======================================================================
* 1. CONTEXTO DE AUTENTICACIÓN (Manejo de Estado de Usuario)
* (Esta sección se mantiene intacta)
* =======================================================================
*/

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [token, setToken] = useState(null);
    const [userRole, setUserRole] = useState(null);

    // Cargar token desde localStorage al iniciar
    useEffect(() => {
        const storedToken = localStorage.getItem('energisense-token');
        const storedRole = localStorage.getItem('energisense-role');
        const storedEmail = localStorage.getItem('energisense-email');

        if (storedToken && storedRole && storedEmail) {
            setToken(storedToken);
            setUserRole(storedRole);
            setUser({ email: storedEmail }); // Simulación de objeto de usuario
        }
        setLoadingAuth(false);
    }, []);

    const handleLoginSuccess = (email, role, jwtToken) => {
        setToken(jwtToken);
        setUserRole(role);
        setUser({ email });
        localStorage.setItem('energisense-token', jwtToken);
        localStorage.setItem('energisense-role', role);
        localStorage.setItem('energisense-email', email);
    };

    const handleLogout = () => {
        setToken(null);
        setUserRole(null);
        setUser(null);
        localStorage.removeItem('energisense-token');
        localStorage.removeItem('energisense-role');
        localStorage.removeItem('energisense-email');
    };

    return (
        <AuthContext.Provider value={{
            user,
            userRole,
            token,
            loadingAuth,
            handleLoginSuccess,
            handleLogout,
        }}>
            {children}
        </AuthContext.Provider>
    );
};


/*
* =======================================================================
* 2. COMPONENTES DE LA APLICACIÓN
* (Sección de la App existente + Home Page)
* =======================================================================
*/

// --- 2.1 Componente de Notificación (Toast) ---
// (Sin cambios)
const Notification = ({ message, type, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (message) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
                if (onClose) onClose();
            }, 3000); 
            return () => clearTimeout(timer);
        }
    }, [message, onClose]);

    if (!isVisible) return null;

    const styles = {
        notification: {
            position: 'fixed',
            top: '90px', // Ajustado para no chocar con el GlobalHeader
            right: '20px',
            padding: '15px 25px',
            borderRadius: '8px',
            color: '#FFFFFF',
            fontWeight: 'bold',
            zIndex: 1000,
            opacity: 0.9,
            transition: 'opacity 0.5s',
            fontSize: '1rem',
        },
        success: { backgroundColor: '#4ade80', color: '#111827' },
        error: { backgroundColor: '#ef4444' },
        info: { backgroundColor: '#06b6d4' }
    };

    return (
        <div style={{ ...styles.notification, ...(styles[type] || styles.info) }}>
            {message}
        </div>
    );
};

// --- 2.2 Encabezado Global (NUEVO) ---
// Este encabezado controla la navegación principal
const GlobalHeader = ({ currentView, onNavigate, isAuthenticated, onLogout }) => {
    const styles = {
        header: {
            backgroundColor: '#1F2937', // Gris oscuro
            padding: '0 40px',
            height: '70px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid #06B6D4', // Acento cian
            position: 'sticky',
            top: 0,
            zIndex: 900,
            color: '#E5E7EB',
        },
        logo: {
            fontSize: '1.8rem',
            fontWeight: 'bold',
            color: '#06B6D4',
            cursor: 'pointer',
        },
        nav: {
            display: 'flex',
            gap: '15px',
        },
        navButton: {
            padding: '10px 15px',
            backgroundColor: 'transparent',
            color: '#9CA3AF', // Gris claro
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '1rem',
            transition: 'background-color 0.3s, color 0.3s',
        },
        navButtonActive: {
            color: '#FFFFFF',
            backgroundColor: '#374151', // Gris medio
        }
    };
    
    return (
        <header style={styles.header}>
            <div style={styles.logo} onClick={() => onNavigate('home')}>
                EnergiSense
            </div>
            <nav style={styles.nav}>
                <button 
                    onClick={() => onNavigate('home')}
                    style={{...styles.navButton, ...(currentView === 'home' && styles.navButtonActive)}}
                >
                    Página Informativa
                </button>
                
                {isAuthenticated ? (
                    <button 
                        onClick={() => onNavigate('app')}
                        style={{...styles.navButton, ...(currentView === 'app' && styles.navButtonActive)}}
                    >
                        Ir al Dashboard
                    </button>
                ) : (
                    <button 
                        onClick={() => onNavigate('app')}
                        style={{...styles.navButton, ...(currentView === 'app' && styles.navButtonActive)}}
                    >
                        Iniciar Sesión
                    </button>
                )}
                
                {isAuthenticated && (
                    <button 
                        onClick={onLogout}
                        style={{...styles.navButton, backgroundColor: '#ef4444', color: 'white'}}
                    >
                        Cerrar Sesión
                    </button>
                )}
            </nav>
        </header>
    );
};

// --- 2.3 Página Informativa (Home Page) [NUEVO] ---
// Esta página es estática y no usa axios.
const HomePage = ({ onNavigateToApp }) => {
    
    // Estilos para la Home Page
    const homeStyles = {
        container: {
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '40px 20px',
            color: '#E5E7EB',
        },
        header: {
            textAlign: 'center',
            marginBottom: '40px',
            paddingBottom: '20px',
            borderBottom: '2px solid #374151',
        },
        h1: {
            fontSize: '3rem',
            fontWeight: 'bold',
            color: '#06B6D4', // Cian
            marginBottom: '10px',
        },
        h2: {
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#E5E7EB',
            borderBottom: '1px solid #06B6D4',
            paddingBottom: '10px',
            marginBottom: '20px',
        },
        p: {
            fontSize: '1.1rem',
            lineHeight: '1.7',
            color: '#D1D5DB', // Texto
            marginBottom: '15px',
        },
        section: {
            backgroundColor: '#1F2937', // Tarjeta gris oscuro
            padding: '30px',
            borderRadius: '12px',
            marginBottom: '30px',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
        },
        ctaButton: {
            display: 'inline-block',
            padding: '15px 30px',
            backgroundColor: '#06B6D4',
            color: '#111827',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            textDecoration: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'transform 0.2s',
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
        },
        techCard: {
            backgroundColor: '#374151',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center',
        }
    };

    return (
        <div style={homeStyles.container}>
            <header style={homeStyles.header}>
                <h1 style={homeStyles.h1}>Bienvenido a EnergiSense</h1>
                <p style={{...homeStyles.p, fontSize: '1.3rem', color: '#9CA3AF'}}>
                    Monitoreo y Optimización de Energía Industrial en Tiempo Real.
                </p>
            </header>

            <section style={homeStyles.section}>
                <h2 style={homeStyles.h2}>¿Qué es EnergiSense (DashboardApp)?</h2>
                <p style={homeStyles.p}>
                    EnergiSense es una plataforma de software diseñada para abordar la necesidad crítica de <strong>monitoreo energético eficiente</strong> en instalaciones industriales. La aplicación proporciona un dashboard centralizado que visualiza datos de consumo en tiempo real (kWh), permitiendo a los administradores identificar ineficiencias, gestionar el acceso y optimizar costos operativos.
                </p>
                <div style={{textAlign: 'center', marginTop: '30px'}}>
                    <button 
                        onClick={onNavigateToApp} 
                        style={homeStyles.ctaButton}
                        onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                        onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                    >
                        Acceder a la Aplicación
                    </button>
                </div>
            </section>

            <section style={homeStyles.section}>
                <h2 style={homeStyles.h2}>Arquitectura Tecnológica (Stack MERN)</h2>
                <div style={homeStyles.grid}>
                    <div style={homeStyles.techCard}>
                        <h3>MongoDB (Base de Datos)</h3>
                        <p style={{...homeStyles.p, fontSize: '0.9rem'}}>Base de datos NoSQL local (`energisense_db`) para almacenar lecturas de sensores (time-series) y perfiles de usuario.</p>
                    </div>
                    <div style={homeStyles.techCard}>
                        <h3>Express.js (Backend)</h3>
                        <p style={{...homeStyles.p, fontSize: '0.9rem'}}>API RESTful (Node.js) que maneja la lógica de negocio, seguridad JWT y conexión a la base de datos.</p>
                    </div>
                    <div style={homeStyles.techCard}>
                        <h3>React (Frontend)</h3>
                        <p style={{...homeStyles.p, fontSize: '0.9rem'}}>Interfaz de usuario (SPA) construida con React (Vite) para un dashboard dinámico y responsivo, usando CSS-in-JS.</p>
                    </div>
                </div>
            </section>

            <section style={homeStyles.section}>
                <h2 style={homeStyles.h2}>Funcionalidades Clave</h2>
                <ul style={{...homeStyles.p, listStyle: 'disc', paddingLeft: '20px'}}>
                    <li><strong>Dashboard en Tiempo Real:</strong> Gráficos (Recharts) y Widgets que se actualizan cada 5 segundos.</li>
                    <li><strong>Autenticación Segura:</strong> Sistema de Login basado en JSON Web Tokens (JWT) y contraseñas hasheadas (Bcrypt).</li>
                    <li><strong>Control de Acceso por Roles:</strong> Vistas diferenciadas para "Administrador" (control total) y "Usuario Estándar" (solo lectura).</li>
                    <li><strong>Gestión de Usuarios:</strong> Panel de administración para crear nuevos usuarios (roles Admin/User).</li>
                    <li><strong>Simulación IoT:</strong> Un script (`data_injector.js`) simula el envío constante de datos de sensores a la API.</li>
                </ul>
            </section>
        </div>
    );
};

// --- 2.4 Contenido de la Aplicación (Login, Dashboards, Admin) ---
// (Esta es toda la lógica que ya tenías, ahora encapsulada)
const AppContent = ({ showNotification }) => {
    const { user, loadingAuth, handleLoginSuccess } = useAuth();
    
    if (loadingAuth) {
        return (
            <div style={{minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06B6D4', fontSize: '1.5rem'}}>
                Cargando...
            </div>
        );
    }
    
    // Si no está autenticado, muestra el Login
    if (!user) {
        return <Login showNotification={showNotification} onLoginSuccess={handleLoginSuccess} />;
    }
    
    // Si está autenticado, muestra el dashboard correspondiente
    return <AuthenticatedApp showNotification={showNotification} />;
};


/*
* =======================================================================
* 3. COMPONENTES INTERNOS DE LA APP
* (Login, Dashboards, Gráficas, Paneles, etc. - SIN MODIFICACIONES)
* =======================================================================
*/

// --- 3.1 Componente Login ---
const Login = ({ showNotification }) => {
    const { handleLoginSuccess } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Estilos del Login
    const loginStyles = {
        container: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'calc(100vh - 70px)', // Resta la altura del header
            padding: '20px',
        },
        card: {
            backgroundColor: '#1F2937',
            padding: '40px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
            border: '2px solid #06B6D4',
            width: '100%',
            maxWidth: '450px',
            textAlign: 'center',
        },
        title: {
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: '#06B6D4',
            marginBottom: '15px',
        },
        input: {
            width: '100%',
            padding: '12px 15px',
            marginBottom: '20px',
            border: '1px solid #374151',
            borderRadius: '6px',
            backgroundColor: '#374151',
            color: '#FFFFFF',
            fontSize: '1rem',
            boxSizing: 'border-box',
        },
        button: {
            width: '100%',
            padding: '12px',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: '#06B6D4',
            color: '#111827',
            fontWeight: 'bold',
            fontSize: '1.2rem',
            cursor: 'pointer',
        },
        p: {
            color: '#9CA3AF',
            marginTop: '25px',
            borderTop: '1px solid #374151',
            paddingTop: '15px',
            fontSize: '0.9rem',
            textAlign: 'left',
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        showNotification(null); 

        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', { email, password });
            const { token, role, email: userEmail } = response.data;
            handleLoginSuccess(userEmail, role, token);
            showNotification('¡Inicio de sesión exitoso!', 'success');
        } catch (error) {
            let msg = error.response?.data?.msg || error.response?.data?.message || 'Credenciales inválidas.';
            if (!error.response) {
                msg = 'Error de conexión: El servidor backend (http://localhost:5000) no responde.';
            }
            showNotification(msg, 'error');
            console.error("Login error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={loginStyles.container}>
            <div style={loginStyles.card}>
                <h1 style={loginStyles.title}>EnergiSense | Acceso Industrial</h1>
                <p style={{ color: '#9CA3AF', marginBottom: '30px' }}>Introduce tus credenciales para acceder al Dashboard.</p>
                
                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={loginStyles.input}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={loginStyles.input}
                        required
                    />
                    <button type="submit" disabled={loading} style={{...loginStyles.button, opacity: loading ? 0.6 : 1}}>
                        {loading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
                    </button>
                </form>
                
                <p style={loginStyles.p}>
                    Prueba con: <br />
                    Admin: <strong>admin@energisense.com / password123</strong> <br />
                    Usuario: <strong>user1@energisense.com / password123</strong> (Si ya se creó)
                </p>
            </div>
        </div>
    );
};


// --- 3.2 Componente AuthenticatedApp (El corazón del Dashboard) ---
const REFRESH_INTERVAL_MS = 5000; 

// (Hook para detectar el ancho de la ventana)
const useViewport = () => {
    const [width, setWidth] = useState(window.innerWidth);
    useEffect(() => {
        const handleWindowResize = () => setWidth(window.innerWidth);
        window.addEventListener("resize", handleWindowResize);
        return () => window.removeEventListener("resize", handleWindowResize);
    }, []);
    return { width };
};

// (Función para estilos de cuadrícula responsivos)
const getGridStyle = (width, numColumnsDesktop) => {
    let columns = numColumnsDesktop;
    if (width < 640) columns = 1;
    else if (width < 1024) columns = 2;
    
    return {
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '20px',
    };
};

// (Definiciones de DataWidget, EnergyChart, UserManagementPanel, UserDashboard, AdminDashboard)
// ... (Estos componentes son idénticos a la versión anterior) ...

// (DataWidget)
const DataWidget = ({ title, value, unit, icon, color }) => {
    const { width } = useViewport();
    const isMobile = width < 640;
    const widgetStyle = {
        backgroundColor: '#1F2937',
        padding: isMobile ? '15px' : '20px',
        borderRadius: '10px',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
        borderLeft: `5px solid ${color}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: '#E5E7EB',
        transition: 'transform 0.2s',
        minHeight: '140px',
    };
    return (
        <div 
            style={widgetStyle}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1rem', fontWeight: '500', color: '#9CA3AF' }}>{title}</span>
                <span style={{ fontSize: '1.5rem', color: color }}>{icon}</span>
            </div>
            <div style={{ marginTop: '15px' }}> 
                <p style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: 'bold', color: color, margin: '0' }}>
                    {value}
                </p>
                <span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#9CA3AF' }}>{unit}</span>
            </div>
        </div>
    );
};

// (EnergyChart)
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{padding: '10px', backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '4px', color: '#E5E7EB', fontSize: '0.9rem'}}>
                <p style={{fontWeight: 'bold', color: '#06B6D4'}}>{`Tiempo: ${label}`}</p>
                <p>{`Consumo: ${payload[0].value.toFixed(2)} kWh`}</p>
            </div>
        );
    }
    return null;
};
const EnergyChart = ({ data }) => {
    const { width } = useViewport();
    const isMobile = width < 640;
    return (
        <ResponsiveContainer width="100%" height={isMobile ? 250 : 350}>
            {data.length > 0 ? (
                <LineChart data={data} margin={{ top: 15, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                        dataKey="timestamp" 
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF', fontSize: 10 }}
                        interval="preserveStartEnd" 
                        angle={isMobile ? -45 : 0} 
                        textAnchor={isMobile ? "end" : "middle"}
                        height={isMobile ? 50 : 30}
                    />
                    <YAxis 
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF', fontSize: 10 }}
                        tickFormatter={(value) => value.toFixed(0)} 
                        domain={['dataMin - 10', 'dataMax + 20']} 
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {!isMobile && <Legend wrapperStyle={{ color: '#E5E7EB', paddingTop: '10px' }} />}
                    <Line
                        type="monotone" 
                        dataKey="valor" 
                        name="Consumo (kWh)"
                        stroke="#06b6d4" 
                        strokeWidth={2}
                        dot={false} 
                        activeDot={{ r: 4, fill: '#06b6d4', stroke: '#FFFFFF', strokeWidth: 1 }}
                    />
                </LineChart>
            ) : (
                <div style={{textAlign: 'center', padding: '50px', color: '#9CA3AF', fontSize: '1rem'}}>
                    No hay datos disponibles. Asegúrate de que el backend y el inyector estén activos.
                </div>
            )}
        </ResponsiveContainer>
    );
};

// (UserManagementPanel)
const UserManagementPanel = ({ showNotification, onBack }) => {
    const { token } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');
    const [loading, setLoading] = useState(false);
    
    // (Estilos y lógica de formulario de registro idénticos a la versión anterior)
    const adminStyles = {
        container: {
            padding: '20px', 
            backgroundColor: '#1F2937', 
            borderRadius: '10px', 
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)', 
            color: '#E5E7EB',
            border: '1px solid #06B6D4'
        },
        h2: {
            fontSize: '1.8rem', 
            fontWeight: 'bold', 
            color: '#06B6D4', 
            borderBottom: '1px solid #374151', 
            paddingBottom: '15px', 
            marginBottom: '20px'
        },
        form: {
            display: 'grid',
            gridTemplateColumns: '1fr', 
            gap: '20px',
            marginTop: '20px',
        },
        input: {
            width: '100%',
            padding: '12px 15px',
            border: '1px solid #374151',
            borderRadius: '6px',
            backgroundColor: '#374151',
            color: '#FFFFFF',
            fontSize: '1rem',
            boxSizing: 'border-box',
        },
        button: {
            padding: '12px 20px',
            backgroundColor: '#4ade80', 
            color: '#111827',
            border: 'none',
            borderRadius: '5px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '1rem',
        }
    };
    const { width } = useViewport();
    if (width >= 768) {
        adminStyles.form.gridTemplateColumns = 'repeat(3, 1fr)';
    }

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        showNotification(null);
        try {
            await axios.post('http://localhost:5000/api/auth/register', 
                { email, password, role },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            showNotification(`Usuario ${email} creado con éxito.`, 'success');
            setEmail('');
            setPassword('');
            setRole('user');
        } catch (error) {
            let msg = error.response?.data?.msg || 'Error al crear el usuario.';
            showNotification(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={adminStyles.container}>
            <h2 style={adminStyles.h2}>👥 Funciones de Administración</h2>
            <button onClick={onBack} style={{ backgroundColor: '#374151', color: '#E5E7EB', padding: '8px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '20px' }}>
                &larr; Volver al Dashboard
            </button>
            <h3 style={{fontSize: '1.2rem', color: '#4ade80', marginBottom: '15px'}}>Registrar Nuevo Usuario</h3>
            <form onSubmit={handleRegisterSubmit} style={adminStyles.form}>
                <div>
                    <label>Email:</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={adminStyles.input} />
                </div>
                <div>
                    <label>Contraseña:</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={adminStyles.input} />
                </div>
                <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'}}>
                    <label>Rol:</label>
                    <select value={role} onChange={(e) => setRole(e.target.value)} style={adminStyles.input}>
                        <option value="user">Usuario Estándar</option>
                        <option value="admin">Administrador</option>
                    </select>
                </div>
                <div style={{gridColumn: '1 / -1', marginTop: '10px'}}>
                    <button type="submit" disabled={loading} style={{...adminStyles.button, opacity: loading ? 0.6 : 1}}>
                        {loading ? 'Registrando...' : 'Confirmar Registro'}
                    </button>
                </div>
            </form>
            <div style={{marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #374151'}}>
                <h3 style={{fontSize: '1.2rem', color: '#FCD34D', marginBottom: '15px'}}>Lista de Usuarios (Funcionalidad Pendiente)</h3>
                <p style={{color: '#9CA3AF'}}>La próxima iteración mostrará aquí la tabla de usuarios existentes.</p>
            </div>
        </div>
    );
};

// (UserDashboard)
const UserDashboard = ({ latestData, averageConsumption, totalRecords, currentReading, handleLogout }) => {
    const { width } = useViewport();
    const gridStyle = getGridStyle(width, 3);
    const dashboardStyles = {
        padding: width < 640 ? '10px 10px 20px 10px' : '20px 40px 40px 40px',
        maxWidth: '1400px',
        margin: '0 auto',
        color: '#E5E7EB',
    };
    return (
        <div style={dashboardStyles}>
            <div style={{marginBottom: '20px', textAlign: 'center'}}>
                <h2 style={{fontSize: '2rem', fontWeight: 'bold', color: '#06B6D4', margin: '10px 0'}}>Dashboard Industrial (Usuario)</h2>
                <p style={{color: '#9CA3AF'}}>Vista de solo lectura del monitoreo de consumo.</p>
            </div>
            <div style={gridStyle}>
                <DataWidget title="Lectura Actual" value={currentReading.toFixed(2)} unit="kWh" icon="⚡" color="#06b6d4" />
                <DataWidget title="Consumo Promedio" value={averageConsumption.toFixed(2)} unit="kWh" icon="📊" color="#4ade80" />
                <DataWidget title="Registros Total" value={totalRecords.toFixed(0)} unit="pts" icon="📝" color="#facc15" />
            </div>
            <div style={{ backgroundColor: '#1F2937', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)', marginTop: '40px' }}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                    <h3 style={{fontSize: '1.2rem', fontWeight: 'bold'}}>Monitoreo de Consumo (kWh)</h3>
                    <p style={{fontSize: '0.9rem', color: '#9CA3AF'}}>Actualización: cada 5 segundos</p>
                </div>
                <EnergyChart data={latestData} />
            </div>
        </div>
    );
};

// (AdminDashboard)
const AdminDashboard = ({ latestData, averageConsumption, totalRecords, currentReading, handleLogout, userRole, changePage, showNotification }) => {
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'users'
    const { width } = useViewport();
    const gridStyle = getGridStyle(width, 4);
    const dashboardStyles = {
        padding: width < 640 ? '10px 10px 20px 10px' : '20px 40px 40px 40px',
        maxWidth: '1400px',
        margin: '0 auto',
        color: '#E5E7EB',
    };
    const tabContainerStyles = {
        borderBottom: '1px solid #374151',
        marginBottom: '30px',
        display: 'flex',
        gap: '20px',
    };

    return (
        <div style={dashboardStyles}>
            <div style={tabContainerStyles}>
                <TabButton 
                    label="Dashboard Principal" 
                    isActive={activeTab === 'dashboard'} 
                    onClick={() => setActiveTab('dashboard')} 
                />
                <TabButton 
                    label="Gestión de Usuarios" 
                    isActive={activeTab === 'users'} 
                    onClick={() => setActiveTab('users')} 
                    icon="👥"
                />
            </div>
            {activeTab === 'dashboard' ? (
                <>
                    <div style={gridStyle}>
                        <DataWidget title="Lectura Actual" value={currentReading.toFixed(2)} unit="kWh" icon="⚡" color="#06b6d4" />
                        <DataWidget title="Consumo Promedio" value={averageConsumption.toFixed(2)} unit="kWh" icon="📊" color="#4ade80" />
                        <DataWidget title="Registros Total" value={totalRecords.toFixed(0)} unit="pts" icon="📝" color="#facc15" />
                        <DataWidget title="Acceso Admin" value="TOTAL" unit="ROL" icon="🔒" color="#ef4444" />
                    </div>
                    <div style={{ backgroundColor: '#1F2937', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)', marginTop: '40px' }}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                            <h3 style={{fontSize: '1.2rem', fontWeight: 'bold'}}>Monitoreo de Consumo (kWh)</h3>
                            <p style={{fontSize: '0.9rem', color: '#9CA3AF'}}>Actualización: cada 5 segundos</p>
                        </div>
                        <EnergyChart data={latestData} />
                    </div>
                </>
            ) : (
                <UserManagementPanel showNotification={showNotification} onBack={() => setActiveTab('dashboard')} />
            )}
        </div>
    );
};

// (TabButton)
const TabButton = ({ label, isActive, onClick, icon }) => (
    <button
        onClick={onClick}
        style={{
            padding: '10px 20px',
            backgroundColor: isActive ? '#06B6D4' : 'transparent',
            color: isActive ? '#111827' : '#9CA3AF',
            border: 'none',
            borderBottom: isActive ? '3px solid #06B6D4' : '3px solid transparent',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all 0.3s',
            marginBottom: '-1px' 
        }}
    >
        {icon} {label}
    </button>
);

// (AuthenticatedApp - Lógica de datos)
const AuthenticatedApp = ({ showNotification }) => {
    const { user, token, handleLogout, userRole } = useAuth();
    const [latestData, setLatestData] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [errorData, setErrorData] = useState(null);

    // Calculados
    const currentReading = latestData.length > 0 ? latestData[latestData.length - 1].valor : 0;
    const totalRecords = latestData.length;
    const averageConsumption = totalRecords > 0 
        ? (latestData.reduce((sum, item) => sum + (item.valor || 0), 0) / totalRecords) 
        : 0;

    // FUNCIÓN DE CARGA DE DATOS
    const fetchLatestData = useCallback(async () => {
        if (!token) {
            handleLogout();
            return;
        }

        if (latestData.length === 0) setLoadingData(true); 
        setErrorData(null);

        const apiUrl = `http://localhost:5000/api/data/latest`;

        try {
            const response = await axios.get(apiUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!Array.isArray(response.data)) {
                 throw new Error("Respuesta de API no es un array.");
            }

            const formattedData = response.data.map(item => {
                const date = new Date(item.timestamp);
                const timeString = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                
                const cleanValueString = String(item.valor || 0).replace(/[^\d.]/g, '');
                const numericValue = parseFloat(cleanValueString);
                
                return {
                    ...item,
                    timestamp: timeString, 
                    valor: isNaN(numericValue) ? 0 : numericValue
                };
            }).sort((a, b) => new Date(`1970/01/01 ${a.timestamp}`) - new Date(`1970/01/01 ${b.timestamp}`)); 

            setLatestData(formattedData);
            setLoadingData(false);
        } catch (err) {
            console.error('Error al obtener datos en tiempo real:', err);
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                showNotification('Sesión expirada o no autorizada.', 'error');
                handleLogout(); 
            } else if (err.code === 'ERR_NETWORK') {
                setErrorData('Error de red: El servidor backend (http://localhost:5000) parece estar inactivo.');
            }
            setLoadingData(false);
        }
    }, [token, handleLogout, latestData.length, errorData, showNotification]); 
    
    // Loop de Actualización
    useEffect(() => {
        if (user && userRole) { 
            fetchLatestData(); 
            const intervalId = setInterval(fetchLatestData, REFRESH_INTERVAL_MS); 
            return () => clearInterval(intervalId); 
        }
    }, [user, userRole, fetchLatestData]); 
    
    // Notificar si hay un error de datos
    useEffect(() => {
        if (errorData) {
            showNotification(errorData, 'error');
        }
    }, [errorData, showNotification]);

    // Renderizado principal basado en ROL
    if (loadingData && latestData.length === 0 && !errorData) {
         return (
            <div style={{minHeight: 'calc(100vh - 70px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06B6D4', fontSize: '1.5rem'}}>
                Cargando datos del dashboard...
            </div>
        );
    }
    
    if (userRole === 'admin') {
        return <AdminDashboard 
            latestData={latestData} 
            averageConsumption={averageConsumption} 
            totalRecords={totalRecords} 
            currentReading={currentReading} 
            handleLogout={handleLogout} 
            userRole={userRole} 
            showNotification={showNotification}
        />;
    } else {
        return <UserDashboard 
            latestData={latestData} 
            averageConsumption={averageConsumption} 
            totalRecords={totalRecords} 
            currentReading={currentReading} 
            handleLogout={handleLogout}
        />;
    }
};


/*
* =======================================================================
* 4. RENDERIZADOR PRINCIPAL (Manejo de Home Page vs App)
* =======================================================================
*/

const App = () => {
    const { user, loadingAuth, handleLogout } = useAuth();
    const [notification, setNotification] = useState({ message: '', type: 'info' });
    
    // Estado de navegación principal: 'home' (informativa), 'app' (login/dashboard)
    const [currentView, setCurrentView] = useState('home'); // Empieza en 'home'

    // Efecto para cambiar de vista cuando el usuario inicia o cierra sesión
    useEffect(() => {
        if (user) {
            setCurrentView('app'); // Si hay usuario, ir a la app
        } else {
            // Si no hay usuario, quédate en home o login (lo que estuviera activo)
            if (currentView === 'app') {
                setCurrentView('app'); // Si cerró sesión, mostrar 'app' (que cargará el Login)
            }
        }
    }, [user, currentView]);

    const showNotification = useCallback((message, type) => {
        setNotification({ message, type });
    }, []);

    const closeNotification = useCallback(() => {
        setNotification({ message: '', type: '' });
    }, []);

    const handleNavigation = (view) => {
        setCurrentView(view);
    };
    
    const renderContent = () => {
        if (currentView === 'home') {
            return <HomePage onNavigateToApp={() => setCurrentView('app')} />;
        }
        
        // Si la vista es 'app', cargamos el contenido de la aplicación (Login o Dashboard)
        if (loadingAuth) {
            return (
                <div style={{minHeight: 'calc(100vh - 70px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06B6D4', fontSize: '1.5rem'}}>
                    Cargando...
                </div>
            );
        }
        
        if (user) {
            return <AuthenticatedApp showNotification={showNotification} />;
        }
        
        return <Login showNotification={showNotification} />;
    };

    return (
        <div style={{minHeight: '100vh', backgroundColor: '#111827'}}>
            <GlobalHeader 
                currentView={currentView}
                isAuthenticated={!!user}
                onNavigate={handleNavigation}
                onLogout={() => {
                    handleLogout();
                    setCurrentView('home'); // Al cerrar sesión, volver al Home
                }}
            />
            <Notification message={notification.message} type={notification.type} onClose={closeNotification} />
            {renderContent()}
        </div>
    );
};

// --- Envoltura Final de la Aplicación ---
const AppWrapper = () => (
    <AuthProvider>
        <App />
    </AuthProvider>
);

export default AppWrapper;