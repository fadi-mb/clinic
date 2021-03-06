import {
  Controller,
  UseGuards,
  Get,
  UseInterceptors,
  Param,
  Body,
  Query,
  Post,
  Req,
  Patch,
  Put,
} from '@nestjs/common';
import { ClinicService } from './clinic-service.schema';
import MongooseClassSerializerInterceptor from '../utils/mongooseClassSerializer.interceptor';
import RolesGuard from '../authentication/guards/role.guard';
import Role from 'src/common/emuns/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import ParamsWithId from 'src/utils/paramsWithId';
import ClinicServicesService from './clinic-service.service';
import PaginationParams from 'src/utils/paginationParams';
import UpdateClinicServiceDto from './dto/update-service.dto';
import RequestWithUser from 'src/authentication/interfaces/request-with-user.interface';
import ClinicServiceFilterDto from './dto/service-filter.dto';
import CreateClinicServiceDto from './dto/create-service.dto';

@Controller('service')
@UseInterceptors(MongooseClassSerializerInterceptor(ClinicService))
@UseGuards(RolesGuard)
export class ClinicServiceController {
  constructor(private readonly clinicServiceService: ClinicServicesService) {}

  @Post()
  @Roles(Role.ClinicAdmin)
  async createClinicService(
    @Body() clinicServiceData: CreateClinicServiceDto,
    @Req() request: RequestWithUser,
  ) {
    const user = request.user;
    return this.clinicServiceService.create(user, clinicServiceData);
  }

  @Get(':id')
  @Roles(Role.ClinicAdmin)
  async getServiceById(@Param() { id }: ParamsWithId) {
    return this.clinicServiceService.getById(id);
  }

  @Patch(':id/assign')
  @Roles(Role.ClinicAdmin)
  async assignDoctor(
    @Param() { id }: ParamsWithId,
    @Query('doctorId') doctorId: string,
    @Req() request: RequestWithUser,
  ) {
    const user = request.user;
    return this.clinicServiceService.assignDoctor(user, doctorId, id);
  }

  @Patch(':id/unassign')
  @Roles(Role.ClinicAdmin)
  async unassignDoctor(
    @Param() { id }: ParamsWithId,
    @Query('doctorId') doctorId: string,
    @Req() request: RequestWithUser,
  ) {
    const user = request.user;
    return this.clinicServiceService.unassignDoctor(user, doctorId, id);
  }

  @Get()
  listClinicServices(
    @Query() { skip, limit, startId }: PaginationParams,
    @Query() serviceFilter: ClinicServiceFilterDto,
    @Query('searchQuery') searchQuery: string,
  ) {
    return this.clinicServiceService.findAll(
      serviceFilter,
      skip,
      limit,
      startId,
      searchQuery,
    );
  }

  @Put(':id')
  @Roles(Role.ClinicAdmin)
  async updateClinicService(
    @Param() { id }: ParamsWithId,
    @Body() clinicServiceData: UpdateClinicServiceDto,
    @Req() request: RequestWithUser,
  ) {
    const user = request.user;
    return this.clinicServiceService.update(user, id, clinicServiceData);
  }
}
