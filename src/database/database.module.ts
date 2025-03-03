import * as fs from 'fs';
import * as path from 'path';
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { NODE_ENV, DB_CERT } from 'src/config';
import { DEVELOPMENT, PRODUCTION } from 'src/core/constants';
import { databaseConfig } from 'src/core/database/database.config';

@Module({
  imports: [
    // Database ORM Config
    SequelizeModule.forRootAsync({
      useFactory: () => {
        let config;
        switch (NODE_ENV) {
          case DEVELOPMENT:
            config = databaseConfig.development;
            break;
          case PRODUCTION:
            config = databaseConfig.production;
            break;
          default:
            config = databaseConfig.development;
        }

        // Add SSL configuration if necessary
        if (NODE_ENV === PRODUCTION) {
          config.ssl = true;
          config.dialectOptions = {
            ssl: {
              require: true,
            },
          };

          // Add 'ca' property only if DB_CERT is 'true'
          if (DB_CERT === 'true') {
            config.dialectOptions.ssl.ca = fs.readFileSync(
              path.resolve(__dirname, 'rds-ca_bundle.pem'),
              'utf8',
            );
          }
        }

        return {
          ...config,
          autoLoadModels: false,
          synchronize: false,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
