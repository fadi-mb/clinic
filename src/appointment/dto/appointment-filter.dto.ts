import { Optional } from '@nestjs/common';
import { IsMongoId, IsDate } from 'class-validator';

export class AppointmentFilterDto {
  @IsDate()
  @Optional()
  date: Date;

  @IsMongoId()
  @Optional()
  serviceId: string;

  @IsMongoId()
  @Optional()
  doctorId: string;

  @IsMongoId()
  @Optional()
  patientId: string;
}
