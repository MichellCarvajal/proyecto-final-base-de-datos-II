const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// LOGIN
router.post('/login', authController.login);

// REGISTRO
router.post('/register', authController.register);

// BÚSQUEDA DE VUELOS
router.post('/flights/search', authController.searchFlights);

module.exports = router;
