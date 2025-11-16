// server/src/controllers/authController.js

const authService = require('../services/authService');

// LOGIN SIMPLE: Vuelve a usar la función simple del servicio
exports.login = async (req, res) => {
    try {
        const { correo, contrasena } = req.body;

        // Llama a la función simple del servicio que hace la comparación en SQL
        const user = await authService.login(correo, contrasena);

        if (!user) {
            return res.status(401).json({ success: false, message: 'Correo o contraseña incorrectos' });
        }

        res.json({ success: true, message: `El usuario ${user.nombre} inició sesión correctamente` });

    } catch (error) {
        console.error("❌ Error en login:", error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

// REGISTRO SIMPLE
exports.register = async (req, res) => {
    const userData = req.body;
    const { contrasena } = userData; // Extraemos la contraseña en texto plano

    // Validación básica de campos requeridos (MANTENEMOS ESTO)
    const requiredFields = ['correo', 'contrasena', 'nombre', 'numeroDocumento', 'telefono1'];
    for (const field of requiredFields) {
        if (!userData[field]) {
            return res.status(400).json({ success: false, message: `El campo ${field} es obligatorio.` });
        }
    }

    try {
        // 1. Verificar si el correo ya existe
        const existingUser = await authService.findUserByEmail(userData.correo);
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'El correo ya está registrado. Intente iniciar sesión.' });
        }
        
        // 3. Llamar al servicio para insertar datos en DB (la función transaccional)
        const newUser = await authService.registerUserWithPhone(userData, contrasena); // ⚠️ Pasamos contrasena 

        res.status(201).json({ 
            success: true,
            idUsuario: newUser.idUsuario,
            message: `¡Registro exitoso! Bienvenido, ${newUser.nombre}.`
        });

    } catch (error) {
        console.error('❌ Error durante el registro:', error);
        if (error.code === 'ER_DUP_ENTRY') {
             return res.status(409).json({ success: false, message: 'El número de documento ya está registrado.' });
        }
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};

// ==========================================================
// >>> BLOQUE AÑADIDO: Controlador de Búsqueda de Vuelos <<<
// ==========================================================

/**
 * Recibe los parámetros de búsqueda del frontend y delega la consulta al servicio.
 * Este endpoint será llamado por el frontend con POST /api/flights/search
 */
exports.searchFlights = async (req, res) => {
    try {
        const searchData = req.body;
        
        // Validación básica 
        if (!searchData.origen || !searchData.destino || !searchData.fechaSalida || !searchData.viajeros) {
            return res.status(400).json({ success: false, message: 'Faltan campos obligatorios para la búsqueda.' });
        }
        
        // Llamada al servicio (que ahora está en authService)
        const flights = await authService.findAvailableFlights(searchData);

        // Envía los resultados de vuelta al frontend
        return res.status(200).json({ 
            success: true,
            flights: flights,
            message: `Búsqueda completada. Encontrados ${flights.length} vuelos.` 
        });

    } catch (error) {
        console.error('❌ Error en flightController.searchFlights:', error);
        if (error.message.includes('Base de datos')) {
            return res.status(503).json({ success: false, message: error.message });
        }
        return res.status(500).json({ success: false, message: 'Error interno del servidor al buscar vuelos.' });
    }
};