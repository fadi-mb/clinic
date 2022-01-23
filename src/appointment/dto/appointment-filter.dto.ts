import { IsMongoId, IsDate, IsOptional } from 'class-validator';

export class AppointmentFilterDto {
  @IsDate()
  @IsOptional()
  date: Date;

  @IsMongoId()
  @IsOptional()
  serviceId: string;

  @IsMongoId()
  @IsOptional()
  doctorId: string;

  @IsMongoId()
  @IsOptional()
  patientId: string;
}
