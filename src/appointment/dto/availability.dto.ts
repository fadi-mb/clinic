import { IsInt, Min, Max, IsMongoId, IsDate } from 'class-validator';
import { TimeInterval } from 'src/users/dto/time-interval.dto';

export class CreateAppointmentDto {
  @IsInt()
  @Min(0)
  @Max(1440)
  startsAt: number;

  @IsDate()
  date: Date;

  @IsMongoId()
  serviceId: string;

  @IsMongoId()
  doctorId: string;

  @IsMongoId()
  patientId: string;
}
