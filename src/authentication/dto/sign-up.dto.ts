import {
  IsEmail,
  IsString,
  IsNotEmpty,
  Matches,
  isEnum,
  IsEnum,
  IsIn,
  IsOptional,
} from 'class-validator';
import Role from 'src/common/emuns/role.enum';

export class SignUpDto {
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

export default SignUpDto;
