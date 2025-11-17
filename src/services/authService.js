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

//HOTELES
exports.findAvailableHotels = async (data) => {
    const { destino, fechaSalida, fechaRegreso, habitaciones, estrellas } = data;

    console.log("🔎 DEBUG → findAvailableHotels recibió estrellas:", estrellas);

    let sql = `
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
    `;

    const sqlValues = [
        fechaRegreso,
        fechaSalida,
        destino.toLowerCase()
    ];

    // ⭐ SI EL USUARIO FILTRA POR ESTRELLAS, AÑADIMOS LA CONDICIÓN
    if (estrellas !== null) {
        sql += ` AND h.estrellas = ? `;
        sqlValues.push(estrellas);
        console.log("⭐ SQL → Se filtrará por estrellas =", estrellas);
    } else {
        console.log("⚠️ SQL → NO se filtra por estrellas (es null)");
    }

    sql += `
        AND sh.idHabitacion IS NULL

        GROUP BY h.idHotel, h.nombre, h.ciudad, h.pais, h.estrellas

        HAVING habitacionesDisponibles >= ?
        ORDER BY precioMinimo ASC
    `;

    sqlValues.push(habitaciones || 1);

    // Ejecutar consulta
    console.log("📌 SQL final ejecutado:", sql);
    console.log("📌 Valores SQL:", sqlValues);

    const [rows] = await pool.query(sql, sqlValues);

    // Mostrar estrellas reales obtenidas
    rows.forEach(h => {
        console.log(`🏨 Hotel encontrado: ${h.nombre} → Estrellas en BD: ${h.estrellas}`);
    });

    return rows;
};


//NUEVA FUNCION HABITACIONES
exports.findRoomsByHotel = async (idHotel) => {
    const sql = `
        SELECT 
            idHabitacion,
            categoria,
            disponibilidad,
            precioNoche
        FROM HABITACION
        WHERE idHotel = ?
    `;

    const [rows] = await pool.query(sql, [idHotel]);
    return rows;
};
