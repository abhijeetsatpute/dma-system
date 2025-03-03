const fs = require('fs');
require('dotenv').config();
const path = require('path');

const config = {
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: process.env.DB_DIALECT,
  database: process.env.DB_NAME,
};

// Add SSL configuration for production
if (process.env.NODE_ENV === 'production') {
  config.dialectOptions = {
    ssl: {
      require: true,
    },
  };

  // Add 'ca' property only if DB_CERT is 'true'
  if (process.env.DB_CERT === 'true') {
    config.dialectOptions.ssl.ca = fs.readFileSync(
      path.resolve(__dirname, '..', '..', `rds-ca_bundle.pem`),
      'utf8',
    );
  }
}

module.exports = {
  development: {
    ...config,
    seederStorage: 'json',
  },
  production: {
    ...config,
    seederStorage: 'sequelize',
    seederStorageTableName: 'seeder_data',
  },
};
