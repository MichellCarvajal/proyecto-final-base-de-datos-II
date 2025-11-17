// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3000;

require('./src/config/db');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const authRoutes = require('./src/routes/authRoutes');

// ⭐ Esta ES LA CORRECCIÓN:
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Servidor Express en http://localhost:${PORT}`);
});
