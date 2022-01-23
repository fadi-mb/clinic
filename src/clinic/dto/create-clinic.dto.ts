import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateClinicAdminDto } from './create-clinic-user.dto';

export class CreateClinicDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  city: string;

  @IsString()
  @IsOptional()
  street: string;

  @IsNotEmpty()
  admin: CreateClinicAdminDto;
}

export class UpdateClinicDto {
  @IsEmail()
  @IsOptional()
  email: string;

  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  city: string;

  @IsString()
  @IsOptional()
  street: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  serviceCategories: string[];
}

export default CreateClinicDto;
