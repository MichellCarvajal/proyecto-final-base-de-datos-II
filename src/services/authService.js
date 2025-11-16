const pool = require('../config/db');

// ⚠️ LOGIN SIMPLE (INSEGURO): Compara la contraseña en la DB
exports.login = async (correo, contrasena) => {
    // Consulta insegura para fines académicos: compara la contraseña en texto plano en la DB.
    const [rows] = await pool.query(
        'SELECT idUsuario, nombre FROM USUARIO WHERE correo = ? AND contrasena = ?',
        [correo, contrasena]
    );

    return rows.length > 0 ? rows[0] : null;
};

// MANTENEMOS: La función findUserByEmail (solo para verificar duplicidad de correo)
exports.findUserByEmail = async (correo) => {
    // Solo necesitamos verificar si el correo existe.
    const sql = 'SELECT idUsuario FROM USUARIO WHERE correo = ?';
    const [rows] = await pool.query(sql, [correo]);
    return rows[0]; 
};

// ⚠️ REGISTRO SIMPLE: Inserta la contraseña en texto plano
exports.registerUserWithPhone = async (userData, contrasena) => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        // 1. Insertar en USUARIO (usando la contraseña en texto plano)
        const userSql = `
            INSERT INTO USUARIO 
            (correo, contrasena, nacionalidad, direccion, tipoDocumento, numeroDocumento, nombre, fechaNacimiento)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const userValues = [
            userData.correo, contrasena, userData.nacionalidad, userData.direccion, 
            userData.tipoDocumento, userData.numeroDocumento, userData.nombre, userData.fechaNacimiento
        ];

        const [userResult] = await connection.query(userSql, userValues);
        const newUserId = userResult.insertId;

        // 2. Insertar Teléfono principal (TELEFONO1)
        const phoneSql1 = `INSERT INTO TELEFONO (idUsuario, telefono) VALUES (?, ?)`;
        await connection.query(phoneSql1, [newUserId, userData.telefono1]);
        
        // 3. Insertar Teléfono secundario (TELEFONO2), si existe
        if (userData.telefono2) {
             const phoneSql2 = `INSERT INTO TELEFONO (idUsuario, telefono) VALUES (?, ?)`;
             await connection.query(phoneSql2, [newUserId, userData.telefono2]);
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

exports.findAvailableFlights = async (data) => {
    const { origen, destino, fechaSalida, fechaRegreso, tripType, viajeros, clase } = data;

    // --- SANITIZACIÓN DE DATOS para búsquedas robustas ---
    const lowerOrigen = origen.toLowerCase();
    const lowerDestino = destino.toLowerCase();
    const lowerClase = clase.toLowerCase(); 
    
    // 1. Consulta SQL para el VUELO DE IDA
    let sql = `
        SELECT 
            v.idVuelo, 
            v.origen, 
            v.destino, 
            v.fechaSalida,                          /* ⬅️ CORREGIDO */
            v.fechaLlegada,                         /* ⬅️ CORREGIDO */
            v.aerolinea,
            MIN(a.precio) as precioBase,            /* ⬅️ Viene de ASIENTO */
            a.categoria AS clase,                   /* ⬅️ Viene de ASIENTO */
            SUM(CASE WHEN a.estado = 'DISPONIBLE' THEN 1 ELSE 0 END) AS asientosDisponibles
        FROM 
            VUELO v
        JOIN 
            ASIENTO a ON v.idVuelo = a.idVuelo      /* ⬅️ JOIN a ASIENTO */
        WHERE 
            LOWER(v.origen) = ? AND             
            LOWER(v.destino) = ? AND            
            DATE(v.fechaSalida) = ? AND             /* ⬅️ CORREGIDO */
            LOWER(a.categoria) = ?                  /* ⬅️ Compara la categoría de asiento */
        GROUP BY 
            v.idVuelo, v.origen, v.destino, v.fechaSalida, v.fechaLlegada, v.aerolinea, a.categoria
        HAVING 
            asientosDisponibles >= ? 
    `;

    // Valores iniciales para el vuelo de IDA: [origen, destino, fecha, clase, viajeros]
    let sqlValues = [lowerOrigen, lowerDestino, fechaSalida, lowerClase, viajeros]; 
    
    // 2. Lógica para manejar viajes de Ida y Vuelta (Roundtrip)
    if (tripType === 'roundtrip' && fechaRegreso) {
        
        let returnSql = `
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
        
        // Añadir los valores para el vuelo de REGRESO. 
        sqlValues.push(lowerDestino, lowerOrigen, fechaRegreso, lowerClase, viajeros); 
    }

    try {
        const [rows] = await pool.query(sql, sqlValues);
        return rows;
        
    } catch (error) {
        console.error('Error al ejecutar la consulta de vuelos:', error);
        throw new Error('Error de Base de datos al buscar vuelos. Detalle: ' + error.message);
    }
};