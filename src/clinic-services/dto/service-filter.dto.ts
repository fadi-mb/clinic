import { IsString, Max, IsMongoId, IsOptional } from 'class-validator';

export default class ClinicServiceFilterDto {
  @IsString()
  @IsOptional()
  category: string;

  @IsMongoId()
  @IsOptional()
  clinicId: string;

  @IsMongoId()
  @IsOptional()
  doctorId: string;
}
