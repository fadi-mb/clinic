import { IsString, Max, IsMongoId, IsOptional } from 'class-validator';

export class ClinicServiceFilterDto {
  @IsString()
  @IsOptional()
  category: string;

  @IsMongoId()
  clinicId: string;
}
