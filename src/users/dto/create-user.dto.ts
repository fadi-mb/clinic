import { Optional } from '@nestjs/common';
import {
  IsEmail,
  IsString,
  IsNotEmpty,
  Matches,
  IsOptional,
  IsMongoId,
} from 'class-validator';
import Role from 'src/common/emuns/role.enum';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsOptional()
  city: string;

  @IsString()
  @IsOptional()
  street: string;

  @IsString()
  @IsNotEmpty()
  @Matches(
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&^(){}[\]:.;,?\/~=|\+_-])[\da-zA-Z@$!%*#?&^(){}[\]:.;,?\/~=|\+_-]{8,16}$/,
    {
      message:
        'Password must be 8-16 characters that includes number, special character, capital and small letters',
    },
  )
  password: string;
}

export class CreateClinicMemberDto extends CreateUserDto {
  @IsMongoId()
  @IsOptional()
  clinicId: string;
}
export class UpdateUserDto {
  @IsEmail()
  @Optional()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Optional()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @Optional()
  lastName: string;

  @IsString()
  @IsOptional()
  @Optional()
  city: string;

  @IsString()
  @IsOptional()
  @Optional()
  street: string;

  @IsString()
  @Optional()
  @Matches(
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&^(){}[\]:.;,?\/~=|\+_-])[\da-zA-Z@$!%*#?&^(){}[\]:.;,?\/~=|\+_-]{8,16}$/,
    {
      message:
        'Password must be 8-16 characters that includes number, special character, capital and small letters',
    },
  )
  password: string;
}

export default CreateUserDto;
