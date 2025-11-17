// src/controllers/authController.js
const authService = require('../services/authService');

// LOGIN
exports.login = async (req, res) => {
    try {
        const { correo, contrasena } = req.body;
        if (!correo || !contrasena) {
            return res.status(400).json({ success: false, message: 'Correo y contraseña son requeridos.' });
        }

        const user = await authService.login(correo, contrasena);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Correo o contraseña incorrectos' });
        }

        // En entorno real aquí emitirías JWT o sesión
        res.json({ success: true, message: `El usuario ${user.nombre} inició sesión correctamente`, user });

    } catch (error) {
        console.error("❌ Error en login:", error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

// REGISTRO
exports.register = async (req, res) => {
    const userData = req.body;
    const { contrasena } = userData;

    const requiredFields = ['correo', 'contrasena', 'nombre', 'numeroDocumento', 'telefono1'];
    for (const field of requiredFields) {
        if (!userData[field]) {
            return res.status(400).json({ success: false, message: `El campo ${field} es obligatorio.` });
        }
    }

    try {
        const existingUser = await authService.findUserByEmail(userData.correo);
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'El correo ya está registrado. Intente iniciar sesión.' });
        }

        const newUser = await authService.registerUserWithPhone(userData, contrasena);

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

// BÚSQUEDA DE VUELOS
exports.searchFlights = async (req, res) => {
    try {
        const searchData = req.body;
        if (!searchData.origen || !searchData.destino || !searchData.fechaSalida || !searchData.viajeros) {
            return res.status(400).json({ success: false, message: 'Faltan campos obligatorios para la búsqueda.' });
        }

        const flights = await authService.findAvailableFlights(searchData);
        return res.status(200).json({
            success: true,
            flights,
            message: `Búsqueda completada. Encontrados ${flights.length} vuelos.`
        });

    } catch (error) {
        console.error('❌ Error en searchFlights:', error);
        if (error.message && error.message.includes('Base de datos')) {
            return res.status(503).json({ success: false, message: error.message });
        }
        return res.status(500).json({ success: false, message: 'Error interno del servidor al buscar vuelos.' });
    }
};

// BÚSQUEDA DE HOTELES
exports.searchHotels = async (req, res) => {
    try {
        const payload = req.body || {};

        let destino = payload.destino || "";
        let fechaSalida = payload.fechaSalida || payload.fechaCheckin;
        let fechaRegreso = payload.fechaRegreso || payload.fechaCheckout;

        // Validaciones básicas
        if (!destino || !fechaSalida || !fechaRegreso) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos obligatorios para la búsqueda de hoteles.'
            });
        }

        // Si check-in y check-out son iguales → sumar 1 día
        if (fechaSalida === fechaRegreso) {
            const d = new Date(fechaRegreso);
            d.setDate(d.getDate() + 1);
            fechaRegreso = d.toISOString().split("T")[0];
        }

        let estrellas = parseInt(payload.estrellas);
        if (isNaN(estrellas)) estrellas = null;

        const data = {
            destino,
            fechaSalida,
            fechaRegreso,
            habitaciones: parseInt(payload.habitaciones) || 1,
            viajeros: parseInt(payload.viajeros) || 1,
            estrellas
        };

        console.log("🔍 DEBUG searchHotels - parámetros finales:", data);

        const hotels = await authService.findAvailableHotels(data);

        return res.status(200).json({
            success: true,
            hotels,
            message: `Búsqueda completada. Encontrados ${hotels.length} hoteles.`
        });

    } catch (error) {
        console.error('❌ Error en searchHotels:', error);

        if (error.message?.includes('Base de datos')) {
            return res.status(503).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al buscar hoteles.'
        });
    }
};

//NUEVA FUNCION HABITACIONES CONTROLLER
exports.getHotelRooms = async (req, res) => {
    try {
        const { idHotel } = req.params;

        const rooms = await authService.findRoomsByHotel(idHotel);

        return res.status(200).json({
            success: true,
            rooms
        });

    } catch (error) {
        console.error("❌ Error getHotelRooms:", error);
        return res.status(500).json({ success: false, message: "Error interno" });
    }
};
