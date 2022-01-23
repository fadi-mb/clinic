import { IsMongoId, IsDate } from 'class-validator';

export class DoctorAvailabilityDto {
  @IsDate()
  date: Date;

  @IsMongoId()
  doctorId: string;
}
