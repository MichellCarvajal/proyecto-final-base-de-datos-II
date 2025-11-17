// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Rutas públicas (montadas en /api desde server.js)
// LOGIN
router.post('/login', authController.login);

// REGISTRO
router.post('/register', authController.register);

// BÚSQUEDAS
router.post('/flights/search', authController.searchFlights);
router.post('/hotels/search', authController.searchHotels);
router.post('/packages/search', authController.searchPackages);

module.exports = router;
