// src/services/authService.js
const pool = require('../config/db'); // Asegúrate de que este módulo exporte el pool (mysql2/promise)

////////////////////////////////////////////////////////////////////////////////
// LOGIN SIMPLE (inseguro) - compara contraseña en texto plano (solo académico)
exports.login = async (correo, contrasena) => {
    const [rows] = await pool.query(
        'SELECT idUsuario, nombre, correo FROM USUARIO WHERE correo = ? AND contrasena = ?',
        [correo, contrasena]
    );
    return rows.length > 0 ? rows[0] : null;
};

// Buscar usuario por correo (verificar duplicidad)
exports.findUserByEmail = async (correo) => {
    const sql = 'SELECT idUsuario FROM USUARIO WHERE correo = ? LIMIT 1';
    const [rows] = await pool.query(sql, [correo]);
    return rows.length > 0 ? rows[0] : null;
};

// Registro con teléfono (transaccional)
exports.registerUserWithPhone = async (userData, contrasena) => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        const userSql = `
            INSERT INTO USUARIO 
            (correo, contrasena, nacionalidad, direccion, tipoDocumento, numeroDocumento, nombre, fechaNacimiento)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const userValues = [
            userData.correo,
            contrasena,
            userData.nacionalidad || null,
            userData.direccion || null,
            userData.tipoDocumento || null,
            userData.numeroDocumento,
            userData.nombre,
            userData.fechaNacimiento || null
        ];

        const [userResult] = await connection.query(userSql, userValues);
        const newUserId = userResult.insertId;

        const phoneSql = `INSERT INTO TELEFONO (idUsuario, telefono) VALUES (?, ?)`;
        await connection.query(phoneSql, [newUserId, userData.telefono1]);

        if (userData.telefono2) {
            await connection.query(phoneSql, [newUserId, userData.telefono2]);
        }

        await connection.commit();
        return { idUsuario: newUserId, nombre: userData.nombre };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// -----------------------------------------------------------------------------
// BUSQUEDA DE VUELOS (CORREGIDO: Solo Economica y Premium)
// -----------------------------------------------------------------------------
exports.findAvailableFlights = async (data) => {
    const { origen, destino, fechaSalida, fechaRegreso, tripType, viajeros, clase } = data;

    // Sanitización básica
    const lowerOrigen = origen.toLowerCase();
    const lowerDestino = destino.toLowerCase();

    // 🚨 AJUSTE CLAVE: Mapeo estricto a las dos únicas clases de la DB: 'economica' o 'premium'
    const claseInputLower = (clase || '').toLowerCase();
    let claseBusquedaDB;

    if (claseInputLower === 'premium') {
        claseBusquedaDB = 'premium';
    } else {
        // Cualquier otro valor (incluido 'economica', 'economy', nulo o basura) se trata como 'economica'.
        claseBusquedaDB = 'economica';
    }


    let sql = `
        SELECT 
            v.idVuelo, 
            v.origen, 
            v.destino, 
            v.fechaSalida,
            v.fechaLlegada,
            v.aerolinea,
            MIN(a.precio) as precioBase,
            a.categoria AS clase,
            SUM(CASE WHEN a.estado = 'DISPONIBLE' THEN 1 ELSE 0 END) AS asientosDisponibles
        FROM 
            VUELO v
        JOIN 
            ASIENTO a ON v.idVuelo = a.idVuelo
        WHERE 
            LOWER(v.origen) = ? AND
            LOWER(v.destino) = ? AND
            DATE(v.fechaSalida) = ? AND
            LOWER(a.categoria) = ? -- Usa solo 'economica' o 'premium'
        GROUP BY 
            v.idVuelo, v.origen, v.destino, v.fechaSalida, v.fechaLlegada, v.aerolinea, a.categoria
        HAVING 
            asientosDisponibles >= ?
    `;

    // Usamos la variable de búsqueda corregida.
    let sqlValues = [lowerOrigen, lowerDestino, fechaSalida, claseBusquedaDB, viajeros];

    // Depuración segura
console.log("SQL:", sql);
console.log("Valores:", sqlValues);

    if (tripType === 'ida_vuelta' && fechaRegreso) {
        const returnSql = `
            UNION ALL
            SELECT 
                v.idVuelo, 
                v.origen, 
                v.destino, 
                v.fechaSalida,
                v.fechaLlegada,
                v.aerolinea,
                MIN(a.precio) as precioBase,
                a.categoria AS clase,
                SUM(CASE WHEN a.estado = 'DISPONIBLE' THEN 1 ELSE 0 END) AS asientosDisponibles
            FROM 
                VUELO v
            JOIN 
                ASIENTO a ON v.idVuelo = a.idVuelo
            WHERE 
                LOWER(v.origen) = ? AND
                LOWER(v.destino) = ? AND
                DATE(v.fechaSalida) = ? AND
                LOWER(a.categoria) = ?
            GROUP BY 
                v.idVuelo, v.origen, v.destino, v.fechaSalida, v.fechaLlegada, v.aerolinea, a.categoria
            HAVING 
                asientosDisponibles >= ?
        `;
        sql += returnSql;
        // Invertimos origen/destino y usamos la misma clase de búsqueda.
        sqlValues.push(lowerDestino, lowerOrigen, fechaRegreso, claseBusquedaDB, viajeros);
    }

    try {
        const [rows] = await pool.query(sql, sqlValues);
        return rows;
    } catch (error) {
        console.error('Error al ejecutar la consulta de vuelos:', error);
        throw new Error('Base de datos: ' + error.message);
    }
};

exports.findAvailableHotels = async (data) => {
    const { destino, fechaSalida, fechaRegreso, habitaciones, estrellas } = data;

    const sql = `
        SELECT 
            h.idHotel,
            h.nombre,
            h.ciudad,
            h.pais,
            h.estrellas,

            MIN(r.precioNoche) AS precioMinimo,
            COUNT(r.idHabitacion) AS habitacionesDisponibles,
            (SELECT COUNT(*) FROM HABITACION WHERE idHotel = h.idHotel) AS totalHabitaciones

        FROM HOTEL h
        JOIN HABITACION r ON h.idHotel = r.idHotel

        LEFT JOIN SERVICIO_HABITACION sh
            ON sh.idHabitacion = r.idHabitacion
            AND sh.fechaEntrada < ?
            AND sh.fechaSalida > ?

        WHERE LOWER(h.ciudad) = ?
          AND h.estrellas >= ?
          AND sh.idHabitacion IS NULL   -- habitación libre

        GROUP BY h.idHotel, h.nombre, h.ciudad, h.pais, h.estrellas

        HAVING habitacionesDisponibles >= ?
        ORDER BY precioMinimo ASC
    `;

    const sqlValues = [
        fechaRegreso,  // sh.fechaEntrada < fechaRegreso
        fechaSalida,   // sh.fechaSalida > fechaSalida
        destino.toLowerCase(),
        estrellas || 0,
        habitaciones || 1
    ];

    try {
        const [rows] = await pool.query(sql, sqlValues);
        return rows;
    } catch (error) {
        console.error("Error SQL Hoteles:", error);
        throw new Error("Base de datos: " + error.message);
    }
};


////////////////////////////////////////////////////////////////////////////////
// BUSQUEDA DE PAQUETES (usa vuelos + hoteles)
exports.findAvailablePackages = async (data) => {
    const { origen, destino, fechaSalida, fechaRegreso, tripType, viajeros, habitaciones, estrellas } = data;

    // Reutilizar funciones anteriores
    const availableFlights = await exports.findAvailableFlights({
        origen, destino, fechaSalida, fechaRegreso, tripType, viajeros, clase: data.clase || 'economy'
    });

    const availableHotels = await exports.findAvailableHotels({
        destino, fechaCheckin: fechaSalida, fechaCheckout: fechaRegreso, viajeros, habitaciones, estrellas
    });

    const packages = [];

    if (availableFlights.length > 0 && availableHotels.length > 0) {
        // Tomamos un vuelo de ida (si existe) y el primer hotel
        const bestFlight = availableFlights.find(f => f.origen && f.origen.toLowerCase() === origen.toLowerCase()) || availableFlights[0];
        const bestHotel = availableHotels[0];

        if (bestFlight && bestHotel) {
            const date1 = new Date(fechaSalida);
            const date2 = new Date(fechaRegreso || fechaSalida);
            const diffTime = Math.abs(date2 - date1);
            const diffDays = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1);

            const vueloPrice = (bestFlight.precioBase || 0) * (viajeros || 1);
            const hotelPrice = (bestHotel.precioNoche || 0) * diffDays * (habitaciones || 1);
            const precioTotalBruto = vueloPrice + hotelPrice;

            const precioFinal = precioTotalBruto * 0.85; // ahorro simulado 15%
            const ahorroSimulado = 15;

            packages.push({
                id: `PKG-${Date.now()}`,
                origen,
                destino,
                vueloIda: bestFlight,
                hotel: bestHotel,
                noches: diffDays,
                precioTotal: precioFinal,
                ahorro: ahorroSimulado
            });
        }
    }

    return packages;
};
