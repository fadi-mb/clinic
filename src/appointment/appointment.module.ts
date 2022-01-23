import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClinicServicesModule } from 'src/clinic-services/clinic-service.module';
import { ClinicsModule } from 'src/clinic/clinic.module';
import { UsersModule } from 'src/users/users.module';
import { AppointmentController } from './appointment.controller';
import { Appointment, AppointmentSchema } from './appointment.schema';
import AppointmentService from './appointment.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
    ]),
    ClinicsModule,
    UsersModule,
    ClinicServicesModule,
  ],
  providers: [AppointmentService],
  exports: [AppointmentService, MongooseModule],
  controllers: [AppointmentController],
})
export class AppointmentsModule {}
