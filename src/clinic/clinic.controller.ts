import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { RolesGuard } from 'src/authentication/guards/role.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import Role from 'src/common/emuns/role.enum';
import CreateUserDto from 'src/users/dto/create-user.dto';
import RequestWithUser from '../authentication/interfaces/request-with-user.interface';
import MongooseClassSerializerInterceptor from '../utils/mongooseClassSerializer.interceptor';
import { PaginationParams } from '../utils/paginationParams';
import ParamsWithId, { SubParamsWithId } from '../utils/paramsWithId';
import { Clinic } from './clinic.schema';
import { ClinicsService } from './clinics.service';
import CreateClinicDto, { UpdateClinicDto } from './dto/create-clinic.dto';

@Controller('clinic')
@UseInterceptors(MongooseClassSerializerInterceptor(Clinic))
export default class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  @Post()
  async registerClinic(@Body() clinicData: CreateClinicDto) {
    return this.clinicsService.create(clinicData);
  }

  @Get()
  async getAllClinics(
    @Query() { skip, limit, startId }: PaginationParams,
    @Query('searchQuery') searchQuery: string,
  ) {
    return this.clinicsService.findAll(skip, limit, startId, searchQuery);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ClinicAdmin)
  async getClinic(
    @Param() { id }: ParamsWithId,
    @Req() request: RequestWithUser,
  ) {
    const user = request.user;
    return this.clinicsService.getById(user, id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ClinicAdmin)
  async updateClinic(
    @Param() { id }: ParamsWithId,
    @Body() clinicData: UpdateClinicDto,
    @Req() request: RequestWithUser,
  ) {
    const user = request.user;
    return this.clinicsService.update(user, id, clinicData);
  }

  @Post(':id/doctor')
  @UseGuards(RolesGuard)
  @Roles(Role.ClinicAdmin)
  async addDoctor(
    @Param() { id }: ParamsWithId,
    @Body() doctorData: CreateUserDto,
    @Req() request: RequestWithUser,
  ) {
    const user = request.user;
    return this.clinicsService.addDoctor(user, id, doctorData);
  }
}
