import {
  Controller,
  UseGuards,
  Get,
  UseInterceptors,
  Param,
  Body,
  Put,
  Query,
  Post,
  Req,
  Patch,
} from '@nestjs/common';
import MongooseClassSerializerInterceptor from '../utils/mongooseClassSerializer.interceptor';
import { RolesGuard } from '../authentication/guards/role.guard';
import Role from 'src/common/emuns/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import ParamsWithId from 'src/utils/paramsWithId';
import AppointmentsService from './appointment.service';
import { PaginationParams } from 'src/utils/paginationParams';
import RequestWithUser from 'src/authentication/interfaces/request-with-user.interface';
import { Appointment } from './appointment.schema';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AppointmentFilterDto } from './dto/appointment-filter.dto';

@Controller('appointment')
@UseInterceptors(MongooseClassSerializerInterceptor(Appointment))
@UseGuards(RolesGuard)
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentsService) {}

  @Post()
  @Roles(Role.Patient)
  async createAppointment(
    @Body() appointmentData: CreateAppointmentDto,
    @Req() request: RequestWithUser,
  ) {
    const user = request.user;
    return this.appointmentService.create(user, appointmentData);
  }

  @Get(':id')
  async getAppointmentById(
    @Param() { id }: ParamsWithId,
    @Req() request: RequestWithUser,
  ) {
    const user = request.user;
    return this.appointmentService.getById(user, id);
  }

  @Get()
  listAppointments(
    @Query() { skip, limit, startId }: PaginationParams,
    @Query() filter: AppointmentFilterDto,
    @Req() request: RequestWithUser,
  ) {
    const user = request.user;
    return this.appointmentService.findAll(user, filter, skip, limit, startId);
  }
}