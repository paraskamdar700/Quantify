const PORT = process.env.PORT || 3000;
const DB_URL = process.env.DATABASE_URL;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
// Export the object containing the constants
module.exports = {
  PORT,
  DB_URL,
  CORS_ORIGIN,
};