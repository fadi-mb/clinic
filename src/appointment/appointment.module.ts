import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClinicServiceSchema } from 'src/ap/clinic-service.schema';
import { ClinicServicesModule } from 'src/clinic-services/clinic-service.module';
import { ClinicService } from 'src/clinic-services/clinic-service.schema';
import { ClinicsModule } from 'src/clinic/clinic.module';
import { User, UserSchema } from 'src/users/user.schema';
import { UsersModule } from 'src/users/users.module';
import { AppointmentController } from './appointment.controller';
import { Appointment, AppointmentSchema } from './appointment.schema';
import AppointmentService from './appointment.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
      // { name: User.name, schema: UserSchema },
      // { name: ClinicService.name, schema: ClinicServiceSchema },
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
