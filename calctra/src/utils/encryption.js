const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const util = require('util');
const logger = require('./logger');

/**
 * Utilities for password hashing and verification
 */
const password = {
  /**
   * Hash a password using bcrypt
   * @param {string} password - Plain text password
   * @param {number} saltRounds - Number of salt rounds (default: 12)
   * @returns {Promise<string>} Hashed password
   */
  hash: async (password, saltRounds = 12) => {
    try {
      const salt = await bcrypt.genSalt(saltRounds);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      logger.error('Password hashing error', { error: error.message });
      throw new Error('Error hashing password');
    }
  },

  /**
   * Verify a password against a hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} Whether password matches hash
   */
  verify: async (password, hash) => {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      logger.error('Password verification error', { error: error.message });
      throw new Error('Error verifying password');
    }
  }
};

/**
 * Utilities for symmetric encryption/decryption
 */
const symmetric = {
  /**
   * Generate a random encryption key
   * @param {number} bytes - Key size in bytes (default: 32 for AES-256)
   * @returns {Buffer} Random key
   */
  generateKey: (bytes = 32) => {
    return crypto.randomBytes(bytes);
  },

  /**
   * Encrypt data using AES-256-GCM
   * @param {Buffer|string} data - Data to encrypt
   * @param {Buffer|string} key - Encryption key
   * @returns {Object} Encrypted data details
   */
  encrypt: (data, key) => {
    // Convert string key to Buffer if needed
    if (typeof key === 'string') {
      key = Buffer.from(key, 'hex');
    }
    
    // Generate a random initialization vector
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    // Convert string data to Buffer if needed
    let dataBuffer = data;
    if (typeof data === 'string') {
      dataBuffer = Buffer.from(data, 'utf8');
    }
    
    // Encrypt the data
    let encrypted = cipher.update(dataBuffer);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    // Get the authentication tag
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted: encrypted.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  },

  /**
   * Decrypt data using AES-256-GCM
   * @param {Object} encryptedData - Object containing encrypted data details
   * @param {string} encryptedData.encrypted - Encrypted data in hex format
   * @param {string} encryptedData.iv - Initialization vector in hex format
   * @param {string} encryptedData.authTag - Authentication tag in hex format
   * @param {Buffer|string} key - Decryption key
   * @returns {Buffer} Decrypted data
   */
  decrypt: (encryptedData, key) => {
    // Convert string key to Buffer if needed
    if (typeof key === 'string') {
      key = Buffer.from(key, 'hex');
    }
    
    // Convert hex strings to Buffers
    const encryptedBuffer = Buffer.from(encryptedData.encrypted, 'hex');
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const authTag = Buffer.from(encryptedData.authTag, 'hex');
    
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt the data
    let decrypted = decipher.update(encryptedBuffer);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted;
  }
};

/**
 * Utilities for asymmetric (public/private key) encryption
 */
const asymmetric = {
  /**
   * Generate a new RSA key pair
   * @param {number} modulusLength - Key size in bits (default: 4096)
   * @returns {Object} Object containing public and private keys in PEM format
   */
  generateKeyPair: async (modulusLength = 4096) => {
    const generateKeyPairAsync = util.promisify(crypto.generateKeyPair);
    
    try {
      const { publicKey, privateKey } = await generateKeyPairAsync('rsa', {
        modulusLength,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      });
      
      return { publicKey, privateKey };
    } catch (error) {
      console.error('Error generating key pair:', error);
      throw new Error('Key pair generation failed');
    }
  },

  /**
   * Encrypt data using a public key
   * @param {Buffer|string} data - Data to encrypt
   * @param {string} publicKey - Public key in PEM format
   * @returns {string} Encrypted data in base64 format
   */
  encrypt: (data, publicKey) => {
    let dataBuffer = data;
    if (typeof data === 'string') {
      dataBuffer = Buffer.from(data, 'utf8');
    }
    
    const encrypted = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
      },
      dataBuffer
    );
    
    return encrypted.toString('base64');
  },

  /**
   * Decrypt data using a private key
   * @param {string} encryptedData - Encrypted data in base64 format
   * @param {string} privateKey - Private key in PEM format
   * @returns {Buffer} Decrypted data
   */
  decrypt: (encryptedData, privateKey) => {
    const encryptedBuffer = Buffer.from(encryptedData, 'base64');
    
    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
      },
      encryptedBuffer
    );
    
    return decrypted;
  }
};

/**
 * Utilities for hashing data
 */
const hash = {
  /**
   * Generate a SHA-256 hash of the data
   * @param {Buffer|string} data - Data to hash
   * @returns {string} Hash in hex format
   */
  sha256: (data) => {
    let dataBuffer = data;
    if (typeof data === 'string') {
      dataBuffer = Buffer.from(data, 'utf8');
    }
    
    return crypto.createHash('sha256').update(dataBuffer).digest('hex');
  },

  /**
   * Generate a HMAC-SHA-256 hash of the data using a secret key
   * @param {Buffer|string} data - Data to hash
   * @param {string} key - Secret key
   * @returns {string} HMAC in hex format
   */
  hmac: (data, key) => {
    let dataBuffer = data;
    if (typeof data === 'string') {
      dataBuffer = Buffer.from(data, 'utf8');
    }
    
    return crypto.createHmac('sha256', key).update(dataBuffer).digest('hex');
  },

  /**
   * Generate a file checksum (SHA-256)
   * @param {Buffer} data - File data
   * @returns {string} Checksum in hex format
   */
  fileChecksum: (data) => {
    return crypto.createHash('sha256').update(data).digest('hex');
  },

  /**
   * Generate a random token
   * @param {number} bytes - Number of bytes (default: 32)
   * @returns {string} Hex string of random bytes
   */
  random: {
    hex: (bytes = 32) => crypto.randomBytes(bytes).toString('hex'),
    base64: (bytes = 32) => crypto.randomBytes(bytes).toString('base64')
  }
};

/**
 * Utilities for generating random values
 */
const random = {
  /**
   * Generate a random buffer of specified size
   * @param {number} bytes - Size in bytes
   * @returns {Buffer} Random bytes
   */
  bytes: (bytes) => {
    return crypto.randomBytes(bytes);
  },

  /**
   * Generate a random hex string of specified length
   * @param {number} length - Length of hex string (bytes × 2)
   * @returns {string} Random hex string
   */
  hex: (length) => {
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
  },

  /**
   * Generate a random token (can be used for verification tokens, etc.)
   * @param {number} bytes - Size in bytes (default: 32)
   * @returns {string} Random token in base64url format
   */
  token: (bytes = 32) => {
    return crypto.randomBytes(bytes).toString('base64url');
  }
};

/**
 * Homomorphic encryption utilities (placeholder for actual implementation)
 * In a real implementation, this would use a library like node-seal
 */
const homomorphic = {
  /**
   * Initialize homomorphic encryption context (would use SEAL in production)
   * @returns {Object} Homomorphic encryption context
   */
  initializeContext: () => {
    try {
      // In a real implementation, this would initialize the SEAL library
      // and set up the encryption parameters
      logger.info('Initializing homomorphic encryption context');
      return {
        initialized: true,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Error initializing homomorphic encryption', { error: error.message });
      throw new Error('Failed to initialize homomorphic encryption');
    }
  },
  
  /**
   * Generate key pair for homomorphic encryption
   * @returns {Object} Object containing public and private keys
   */
  generateKeyPair: () => {
    try {
      // This is a placeholder. In production code, would generate actual HE keys
      logger.info('Generating homomorphic encryption key pair');
      return {
        publicKey: hash.random.hex(64),
        privateKey: hash.random.hex(64)
      };
    } catch (error) {
      logger.error('Error generating homomorphic key pair', { error: error.message });
      throw new Error('Failed to generate homomorphic encryption keys');
    }
  },
  
  /**
   * Encrypt data using homomorphic encryption
   * @param {Object} data - Data to encrypt
   * @param {string} publicKey - Public key for encryption
   * @returns {Object} Encrypted data
   */
  encrypt: (data, publicKey) => {
    try {
      // This is a placeholder. In production, this would perform actual HE
      logger.info('Encrypting data with homomorphic encryption');
      return {
        encrypted: true,
        data: `encrypted_${JSON.stringify(data)}`,
        publicKey
      };
    } catch (error) {
      logger.error('Error in homomorphic encryption', { error: error.message });
      throw new Error('Failed to encrypt data homomorphically');
    }
  },
  
  /**
   * Decrypt homomorphically encrypted data
   * @param {Object} encryptedData - Encrypted data
   * @param {string} privateKey - Private key for decryption
   * @returns {Object} Decrypted data
   */
  decrypt: (encryptedData, privateKey) => {
    try {
      // This is a placeholder. In production, this would perform actual HE decryption
      logger.info('Decrypting homomorphically encrypted data');
      
      if (!encryptedData.encrypted) {
        throw new Error('Data is not encrypted');
      }
      
      // Extract original data from our placeholder format
      const dataStr = encryptedData.data.replace('encrypted_', '');
      return JSON.parse(dataStr);
    } catch (error) {
      logger.error('Error in homomorphic decryption', { error: error.message });
      throw new Error('Failed to decrypt homomorphically encrypted data');
    }
  },
  
  /**
   * Perform computation on homomorphically encrypted data
   * @param {Object} encryptedData - Encrypted data
   * @param {string} operation - Operation to perform
   * @param {Object} params - Additional parameters for the operation
   * @returns {Object} Result of the computation (still encrypted)
   */
  compute: (encryptedData, operation, params = {}) => {
    try {
      // This is a placeholder. In production, this would perform actual HE computation
      logger.info(`Performing ${operation} on encrypted data`);
      return {
        encrypted: true,
        data: `computed_${operation}_${encryptedData.data}`,
        operation,
        params
      };
    } catch (error) {
      logger.error('Error in homomorphic computation', { error: error.message });
      throw new Error(`Failed to perform ${operation} on encrypted data`);
    }
  }
};

// Generate a key if one doesn't exist (for development only)
if (!process.env.ENCRYPTION_KEY && process.env.NODE_ENV !== 'production') {
  process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
  logger.warn('Generated temporary encryption key. In production, set ENCRYPTION_KEY in environment variables.');
}

module.exports = {
  password,
  symmetric,
  asymmetric,
  hash,
  random,
  homomorphic
}; 