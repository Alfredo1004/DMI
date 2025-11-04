import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';

// 1. Definir un Tema de Material UI (MUI) personalizado
// Configuramos los colores primarios y de fondo para el dashboard.
const customTheme = createTheme({
  palette: {
    mode: 'light', // Usamos el modo light para el fondo claro
    primary: {
      main: '#4f46e5', // Indigo (Color principal del gráfico y acentos)
    },
    secondary: {
      main: '#10b981', // Emerald (Para acentos de datos o promedio)
    },
    background: {
      default: '#f4f7f9', // Fondo general gris claro para el contenedor principal
      paper: '#ffffff',  // Fondo de tarjetas y componentes (blanco)
    },
  },
  typography: {
    // Usamos Inter como fuente
    fontFamily: '"Inter", sans-serif', 
  }
});

// Renderizar la aplicación
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 2. Proveedor de Tema de Material UI */}
    <ThemeProvider theme={customTheme}>
      {/* 3. CssBaseline: Limpia los estilos por defecto del navegador */}
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)
