import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from 'src/users/users.module';
import ClinicsController from './clinic.controller';
import { Clinic, ClinicSchema } from './clinic.schema';
import ClinicsService from './clinics.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Clinic.name, schema: ClinicSchema }]),
    UsersModule,
  ],
  providers: [ClinicsService],
  exports: [ClinicsService, MongooseModule],
  controllers: [ClinicsController],
})
export class ClinicsModule {}
