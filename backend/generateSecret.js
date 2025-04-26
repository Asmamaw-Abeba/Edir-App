const crypto = require('crypto');

// Generate a strong, random secret
const generateJwtSecret = () => {
    return crypto.randomBytes(64).toString('hex');
};

// Generate and print the secret
const secret = generateJwtSecret();
console.log(secret);