import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  IsMongoId,
} from 'class-validator';

export class CreateClinicServiceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsInt()
  @Min(20)
  @Max(60 * 2)
  duration: number;

  @IsMongoId()
  clinicId: string;
}
