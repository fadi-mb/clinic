import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClinicServicesModule } from 'src/clinic-services/clinic-service.module';
import { UsersModule } from 'src/users/users.module';
import ClinicsController from './clinic.controller';
import { Clinic, ClinicSchema } from './clinic.schema';
import ClinicsService from './clinics.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Clinic.name, schema: ClinicSchema }]),
    UsersModule,
    forwardRef(() => ClinicServicesModule),
  ],
  providers: [ClinicsService],
  exports: [ClinicsService, MongooseModule],
  controllers: [ClinicsController],
})
export class ClinicsModule {}
