import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from '@hapi/joi';
import { AuthenticationModule } from './authentication/authentication.module';
import { UsersModule } from './users/users.module';
import { ClinicsModule } from './clinic/clinic.module';
import { ClinicServicesModule } from './clinic-services/clinic-service.module';
import { AppointmentsModule } from './appointment/appointment.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        MONGO_USERNAME: Joi.string(),
        MONGO_PASSWORD: Joi.string().when('MONGO_USERNAME', {
          then: Joi.required(),
          otherwise: Joi.forbidden(),
        }),
        MONGO_DATABASE: Joi.string().required(),
        MONGO_HOST: Joi.string().required(),
      }),
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const username = configService.get('MONGO_USERNAME');
        const password = configService.get('MONGO_PASSWORD');
        const database = configService.get('MONGO_DATABASE');
        const host = configService.get('MONGO_HOST');

        return {
          uri: username
            ? `mongodb://${username}:${password}@${host}`
            : `mongodb://${host}`,
          dbName: database,
        };
      },
      inject: [ConfigService],
    }),
    AuthenticationModule,
    UsersModule,
    ClinicsModule,
    ClinicServicesModule,
    AppointmentsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
