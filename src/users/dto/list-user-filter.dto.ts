import { Optional } from '@nestjs/common';
import { IsEmail, IsString, IsOptional, IsMongoId } from 'class-validator';

export class ListUserFilterDto {
  @IsEmail()
  @IsOptional()
  email: string;

  @IsString()
  @IsOptional()
  firstName: string;

  @IsString()
  @IsOptional()
  lastName: string;

  @IsString()
  @IsOptional()
  city: string;

  @IsString()
  @IsOptional()
  street: string;

  @IsMongoId()
  @IsOptional()
  providesServiceId: string;
}

export default ListUserFilterDto;
