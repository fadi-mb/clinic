import { IsMongoId, IsOptional } from 'class-validator';
import CreateUserDto from 'src/users/dto/create-user.dto';

export class CreateClinicAdminDto extends CreateUserDto {
  @IsOptional()
  email: string;
}
