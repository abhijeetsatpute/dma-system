import { IDatabaseConfig } from './interfaces/dbConfig.interface';

import {
  DB_DIALECT,
  DB_HOST,
  DB_NAME,
  DB_PASS,
  DB_PORT,
  DB_USER,
} from 'src/config';

const config = {
  username: DB_USER,
  password: DB_PASS,
  host: DB_HOST,
  port: DB_PORT,
  dialect: DB_DIALECT,
  database: DB_NAME,
};

export const databaseConfig: IDatabaseConfig = {
  development: {
    ...config,
  },
  production: {
    ...config,
  },
};
