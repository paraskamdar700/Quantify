const config = {
  development: {
    database: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      reconnect: true
    },
    port: process.env.PORT || 3000
  },
  production: {
    database: {
      host: process.env.DB_HOST_PROD,
      user: process.env.DB_USER_PROD,
      password: process.env.DB_PASSWORD_PROD,
      database: process.env.DB_NAME_PROD,
      port: process.env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 20,
      queueLimit: 0,
      reconnect: true
    },
    port: process.env.PORT || 3000
  }
};

module.exports = config[process.env.NODE_ENV || 'development'];