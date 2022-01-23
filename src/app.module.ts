import * as Joi from '@hapi/joi';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AppointmentsModule } from './appointment/appointment.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { ClinicServicesModule } from './clinic-services/clinic-service.module';
import { ClinicsModule } from './clinic/clinic.module';
import { TasksService } from './tasks.service';
import { UsersModule } from './users/users.module';

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
        OAUTH_GOOGLE_ID: Joi.string().required(),
        OAUTH_GOOGLE_SECRET: Joi.string().required(),
        OAUTH_GOOGLE_REDIRECT_URL: Joi.string().required(),
        GOOGLE_MAIL_REFRESH_TOKEN: Joi.string().required(),
        APP_MAIL: Joi.string().required(),
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
    ScheduleModule.forRoot(),
    AuthenticationModule,
    UsersModule,
    ClinicsModule,
    ClinicServicesModule,
    AppointmentsModule,
  ],
  controllers: [],
  providers: [TasksService],
})
export class AppModule {}
