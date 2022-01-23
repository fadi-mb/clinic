import { Type } from 'class-transformer';
import { IsInt, Max, Min, ValidateNested } from 'class-validator';

export class TimeInterval {
  @IsInt()
  @Min(0)
  @Max(1440)
  startsAt: number;

  @IsInt()
  @Min(0)
  @Max(1440)
  endsAt: number;
}

export class TimeIntervals {
  @ValidateNested({ each: true })
  @Type(() => TimeInterval)
  shifts: TimeInterval[];
}
