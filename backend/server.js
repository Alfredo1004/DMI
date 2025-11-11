/*
* =======================================================================
* SERVIDOR BACKEND ENERGISENSE (Node.js / Express / MongoDB)
* Versión: 2.0 (MODIFICADO PARA DOCKER)
* =======================================================================
*/

const express = require('express');
const path = require('path'); // <-- 1. IMPORTADO PARA SERVIR ARCHIVOS
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Configuración de la App
const app = express();
app.use(cors());
app.use(express.json());

// --- Modelos de Base de Datos (Mongoose) ---

// Modelo de Usuario
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' }
});
const User = mongoose.model('User', UserSchema);

// Modelo de Datos del Sensor
const SensorDataSchema = new mongoose.Schema({
    sensorId: { type: String, required: true },
    valor: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
});
const SensorData = mongoose.model('SensorData', SensorDataSchema);

// --- Conexión a MongoDB ---
// *** 2. MODIFICACIÓN PARA DOCKER ***
// 'host.docker.internal' es un DNS especial que permite al contenedor
// encontrar el 'localhost' de la máquina anfitriona (tu PC).
const MONGO_URI = process.env.MONGO_URI || 'mongodb://host.docker.internal:27017/energisense_db';

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB conectado (vía Docker Host)...');
}).catch(err => {
    console.error('Error de conexión con MongoDB:', err.message);
    console.error('Asegúrate de que MongoDB esté corriendo en tu PC (no en Docker) y accesible en el puerto 27017.');
});

// --- 3. SERVIR EL FRONTEND ESTÁTICO (NUEVO PARA DOCKER) ---
// Le decimos a Express que sirva todos los archivos estáticos (el build de React)
// desde una carpeta llamada 'public' en el directorio actual del backend.
app.use(express.static(path.join(__dirname, 'public')));
// --- Fin de la sección estática ---


// --- Rutas de la API ---

/*
* @route   POST /api/auth/register
* @desc    Registrar un nuevo usuario (Ruta de Admin)
* @access  Private (requiere token de admin, aunque aquí está simplificado)
*/
app.post('/api/auth/register', async (req, res) => {
    const { email, password, role } = req.body;

    try {
        // 1. Verificar si el usuario ya existe
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'El usuario ya existe' });
        }

        // 2. Crear nuevo usuario
        user = new User({
            email,
            password,
            role: role || 'user' // 'user' por defecto si no se especifica
        });

        // 3. Hashear la contraseña
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // 4. Guardar en la BD
        await user.save();

        // 5. Crear y devolver el token (Opcional, pero bueno para UX)
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'mi_secreto_jwt_muy_seguro', // (Mejor usar variable de entorno)
            { expiresIn: '5h' },
            (err, token) => {
                if (err) throw err;
                res.status(201).json({ msg: `Usuario ${email} (${role}) creado.` });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

/*
* @route   POST /api/auth/login
* @desc    Autenticar usuario y obtener token
* @access  Public
*/
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Verificar si el usuario existe
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Credenciales inválidas' });
        }

        // 2. Comparar contraseñas
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Credenciales inválidas' });
        }

        // 3. Crear y devolver el token
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'mi_secreto_jwt_muy_seguro',
            { expiresIn: '5h' },
            (err, token) => {
                if (err) throw err;
                // Enviar el token, el rol y el email
                res.json({
                    token,
                    role: user.role,
                    email: user.email
                });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// --- Middleware de Autenticación (para proteger rutas) ---
const auth = (req, res, next) => {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
        return res.status(401).json({ msg: 'No hay token, autorización denegada' });
    }

    try {
        const token = authHeader.split(' ')[1]; // Quita "Bearer "
        if (!token) {
            return res.status(401).json({ msg: 'Token malformado' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mi_secreto_jwt_muy_seguro');
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token no es válido' });
    }
};

/*
* @route   POST /api/data/inject
* @desc    Ruta (no protegida) para que el script inyector inserte datos
* @access  Public
*/
app.post('/api/data/inject', async (req, res) => {
    try {
        const { sensorId, valor } = req.body;
        const newData = new SensorData({
            sensorId,
            valor,
            timestamp: new Date()
        });
        await newData.save();
        res.status(201).json(newData);
    } catch (err) {
        console.error('Error al inyectar datos:', err.message);
        res.status(500).send('Error del servidor');
    }
});

/*
* @route   GET /api/data/latest
* @desc    Obtener los últimos 50 puntos de datos
* @access  Private (requiere token)
*/
app.get('/api/data/latest', auth, async (req, res) => {
    try {
        // Obtenemos los 50 registros más recientes, ordenados por timestamp descendente
        const data = await SensorData.find()
            .sort({ timestamp: -1 })
            .limit(50);
        
        // Los invertimos para que 'recharts' los pinte de izq. a der. (antiguo a nuevo)
        res.json(data.reverse());

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});


// --- 4. RUTA CATCH-ALL (NUEVO PARA DOCKER) ---
// Para cualquier otra ruta que no sea de la API (ej. /dashboard, /admin),
// le decimos a Express que simplemente devuelva el archivo principal de React.
// React (React Router) se encargará de mostrar el componente correcto.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// --- Iniciar Servidor ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));