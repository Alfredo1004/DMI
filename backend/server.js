// Importaciones de módulos
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // Para hashear contraseñas
const jwt = require('jsonwebtoken'); // Para tokens de autenticación

// Cargar variables de entorno (MONGO_URI)
dotenv.config();

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware (Permite la comunicación con el frontend y el manejo de JSON)
app.use(cors()); 
app.use(express.json()); 

// --- DEFINICIÓN DE SCHEMAS Y MODELOS ---

// 1. Modelo de Datos de Energía (ya existente)
const dataSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    value: { type: Number, required: true, default: 0 }, // Aseguramos default 0
    type: { type: String, required: true, default: 'kWh' } // Aseguramos default 'kWh'
});
const DataModel = mongoose.model('Data', dataSchema);

// 2. Modelo de Usuario (NUEVO)
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
});

// Pre-save hook para hashear la contraseña antes de guardarla
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});
const UserModel = mongoose.model('User', userSchema);


// --- MIDDLEWARE DE AUTENTICACIÓN (CORREGIDO) ---

// Función para verificar si el token es válido
const auth = (req, res, next) => {
    // 1. OBTENER EL TOKEN DEL HEADER 'Authorization'
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
        return res.status(401).json({ message: 'No se encontró el header de autorización', reason: 'Missing Auth Header' });
    }

    // El formato es 'Bearer [token]', necesitamos extraer solo el token.
    const parts = authHeader.split(' ');
        
    // Verificar formato (debe tener 'Bearer' y el token)
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
        return res.status(401).json({ message: 'Formato de token no válido (Esperado: Bearer <token>)', reason: 'Invalid Format' });
    }

    const token = parts[1]; // Este es el JWT
    
    if (!token) {
        return res.status(401).json({ message: 'No hay token, autorización denegada', reason: 'No Token Found' });
    }

    try {
        // 2. Verificar el token y obtener el payload (user.id, user.role)
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key'); // Usar variable de entorno o fallback
        req.user = decoded.user;
        next();
    } catch (e) {
        // Error de verificación JWT (ej. token expirado o inválido)
        console.error("JWT Verification Error:", e.message);
        res.status(401).json({ message: 'Token no válido o expirado', reason: e.message });
    }
};

// Función para restringir rutas solo a administradores
const adminAuth = (req, res, next) => {
    // Reutiliza la función 'auth' para verificar el token primero
    auth(req, res, () => {
        // Verifica si el rol es 'admin'
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Acceso denegado: Se requiere rol de Administrador' });
        }
        next();
    });
};


// --- 3. RUTAS DE LA API ACTUALIZADAS ---

// Ruta GET: para obtener los últimos 100 registros (protegida por autenticación)
app.get('/api/data/latest', auth, async (req, res) => {
    try {
        const latestData = await DataModel.find()
            .sort({ timestamp: -1 })
            .limit(100);
            
        // Cambiamos el nombre de la propiedad 'value' a 'valor' para que coincida con el frontend
        const formattedData = latestData.map(item => ({
            timestamp: item.timestamp,
            valor: item.value,
            type: item.type
        }));

        res.json(formattedData.reverse()); 
    } catch (error) {
        console.error("Error al obtener datos:", error.message);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Ruta POST: para recibir nuevos datos del inyector (no requiere auth)
app.post('/api/data', async (req, res) => {
    // ... La lógica de guardar datos es la misma ...
    try {
        // Ajustamos la creación del modelo para usar 'value'
        const dataToSave = {
            value: req.body.valor || req.body.value, // Soporte para 'valor' o 'value'
            type: req.body.type || 'kWh',
            timestamp: req.body.timestamp
        };
        const newData = new DataModel(dataToSave);

        await newData.save();
        console.log(`[POST] Dato guardado: ${newData.value} ${newData.type}`);
        res.status(201).json(newData);
    } catch (error) {
        console.error("Error al guardar dato:", error.message);
        res.status(400).json({ message: 'Error al procesar la solicitud', error: error.message });
    }
});

// --- NUEVAS RUTAS DE AUTENTICACIÓN Y ADMINISTRACIÓN ---

// RUTA POST /api/auth/register: Crear un nuevo usuario (solo para admin)
app.post('/api/auth/register', adminAuth, async (req, res) => {
    const { email, password, role } = req.body;
    try {
        let user = await UserModel.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'El usuario ya existe' });
        }

        user = new UserModel({ email, password, role: role || 'user' });

        await user.save();
        res.status(201).json({ message: 'Usuario creado exitosamente.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error de servidor');
    }
});

// RUTA POST /api/auth/login: Iniciar sesión
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        // Si las credenciales son válidas, generar JWT
        const payload = {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret_key', // Usar variable de entorno o fallback
            { expiresIn: '5h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, role: user.role, email: user.email });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error de servidor');
    }
});

// RUTA GET /api/admin/users: Obtener lista de usuarios (solo para admin)
app.get('/api/admin/users', adminAuth, async (req, res) => {
    try {
        // Excluir el campo password por seguridad
        const users = await UserModel.find().select('-password');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error de servidor');
    }
});


// Conexión a MongoDB y arranque del servidor
mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('--- Conectado a MongoDB local ---');
        
        // ** CREAR USUARIO ADMIN INICIAL (SOLO SI NO EXISTE) **
        const adminEmail = 'admin@energisense.com';
        let adminUser = await UserModel.findOne({ email: adminEmail });
        
        if (!adminUser) {
            console.log('--- Creando usuario Administrador inicial... ---');
            adminUser = new UserModel({
                email: adminEmail,
                password: 'password123', // Será hasheada automáticamente por el pre-save hook
                role: 'admin',
            });
            await adminUser.save();
            console.log(`--- ADMIN CREADO: Email: ${adminEmail}, Contraseña: password123 ---`);
        } else {
            console.log(`--- Usuario Administrador (${adminEmail}) ya existe. ---`);
        }

        app.listen(PORT, () => {
            console.log(`--- Servidor Express corriendo en http://localhost:${PORT} ---`);
        });
    })
    .catch((error) => {
        console.error('*** Error de conexión a MongoDB ***:', error.message);
    });

module.exports = app;
