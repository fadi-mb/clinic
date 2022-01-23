import { IsInt, Min, Max, IsMongoId, IsDate } from 'class-validator';
import { TimeInterval } from 'src/users/dto/time-interval.dto';

export class CreateAppointmentDto extends TimeInterval {
  // @IsInt()
  // @Min(0)
  // @Max(1440)
  // startsAt: number;

  // @IsInt()
  // @Min(0)
  // @Max(1440)
  // endsAt: number;

  @IsDate()
  date: Date;

  @IsMongoId()
  serviceId: string;

  @IsMongoId()
  doctorId: string;

  @IsMongoId()
  patientId: string;
}
