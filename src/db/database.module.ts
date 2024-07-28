import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '../app/configs/envconfigs';
import { FireBaseService } from './firebase.setup';
import { DatabaseService } from './database.provider';

@Global()
@Module({
  providers: [
    {
      provide: 'FIREBASE_SERVICE',
      useFactory: async (config: ConfigService<EnvConfig>) => {
        const firebase = new FireBaseService(
          config.get('firebase_web'),
          config.get('firebaseServiceAccount'),
        );
        return firebase;
      },
      inject: [ConfigService],
    },
    {
      provide: 'data_source',
      useFactory: async () => {
        const datasource = new DatabaseService();
        await datasource.initialize();
        return datasource;
      },
    },
  ],
  exports: [
    'FIREBASE_SERVICE',
    {
      provide: 'data_source',
      useFactory: async () => {
        const datasource = new DatabaseService();
        await datasource.initialize();
        return datasource;
      },
    },
  ],
})
export class DatabaseModule {}
