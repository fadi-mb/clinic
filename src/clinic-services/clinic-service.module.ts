import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClinicsModule } from 'src/clinic/clinic.module';
import { UsersModule } from 'src/users/users.module';
import { ClinicServiceController } from './clinic-service.controller';
import { ClinicService, ClinicServiceSchema } from './clinic-service.schema';
import ClinicServicesService from './clinic-service.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ClinicService.name, schema: ClinicServiceSchema },
    ]),
    ClinicsModule,
    UsersModule,
  ],
  providers: [ClinicServicesService],
  exports: [ClinicServicesService, MongooseModule],
  controllers: [ClinicServiceController],
})
export class ClinicServicesModule {}
