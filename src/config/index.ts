import * as dotenv from 'dotenv';
dotenv.config();

export const {
  PORT,
  DB_PORT,
  DB_HOST,
  DB_PASS,
  DB_USER,
  DB_NAME,
  DB_DIALECT,
  DB_CERT,
  NODE_ENV,
  ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRATION,
} = process.env;
