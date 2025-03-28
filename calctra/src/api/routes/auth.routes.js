const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validateRegister, validateLogin } = require('../middlewares/validation');

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', validateRegister, authController.register);

/**
 * @route POST /api/auth/login
 * @desc Login user and return JWT token
 * @access Public
 */
router.post('/login', validateLogin, authController.login);

/**
 * @route POST /api/auth/wallet-connect
 * @desc Connect a blockchain wallet
 * @access Public
 */
router.post('/wallet-connect', authController.connectWallet);

/**
 * @route GET /api/auth/verify
 * @desc Verify JWT token
 * @access Private
 */
router.get('/verify', authController.verifyToken);

module.exports = router; 