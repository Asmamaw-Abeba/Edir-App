// src/middleware/language.js
module.exports = (req, res, next) => {
  const lang = req.headers['x-language'] || req.headers['accept-language']?.split(',')[0] || 'en';
  req.setLocale(lang.split('-')[0]); // e.g., "en-US" -> "en"
  next();
};