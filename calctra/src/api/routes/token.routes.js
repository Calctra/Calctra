const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/token.controller');
const { authenticate } = require('../middlewares/auth');

/**
 * @route GET /api/tokens/balance
 * @desc Get CAL token balance
 * @access Private
 */
router.get('/balance', authenticate, tokenController.getBalance);

/**
 * @route POST /api/tokens/transfer
 * @desc Transfer CAL tokens
 * @access Private
 */
router.post('/transfer', authenticate, tokenController.transferTokens);

/**
 * @route GET /api/tokens/transactions
 * @desc Get token transaction history
 * @access Private
 */
router.get('/transactions', authenticate, tokenController.getTransactions);

/**
 * @route GET /api/tokens/price
 * @desc Get current token price
 * @access Public
 */
router.get('/price', tokenController.getTokenPrice);

/**
 * @route POST /api/tokens/stake
 * @desc Stake CAL tokens
 * @access Private
 */
router.post('/stake', authenticate, tokenController.stakeTokens);

/**
 * @route POST /api/tokens/unstake
 * @desc Unstake CAL tokens
 * @access Private
 */
router.post('/unstake', authenticate, tokenController.unstakeTokens);

/**
 * @route GET /api/tokens/rewards
 * @desc Get staking rewards
 * @access Private
 */
router.get('/rewards', authenticate, tokenController.getStakingRewards);

module.exports = router; 