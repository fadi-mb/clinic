import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
} from 'class-validator';

export class SignInDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(16)
  password: string;
}

export default SignInDto;
