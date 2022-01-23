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
} from '@nestjs/common';
import MongooseClassSerializerInterceptor from '../utils/mongooseClassSerializer.interceptor';
import RolesGuard from '../authentication/guards/role.guard';
import Role from 'src/common/emuns/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import ParamsWithId from 'src/utils/paramsWithId';
import AppointmentsService from './appointment.service';
import PaginationParams from 'src/utils/paginationParams';
import RequestWithUser from 'src/authentication/interfaces/request-with-user.interface';
import { Appointment } from './appointment.schema';
import { CreateAppointmentDto } from './dto/availability.dto';
import { AppointmentFilterDto } from './dto/appointment-filter.dto';
import { DoctorAvailabilityDto } from './dto/create-appointment.dto copy';

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
    return this.appointmentService.bookAppointment(user, appointmentData);
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
    return this.appointmentService.listAppointments(
      user,
      filter,
      skip,
      limit,
      startId,
    );
  }

  @Get(':id/doctor-availability')
  async getDoctorAvailability(
    @Param() { id }: ParamsWithId,
    @Query() doctorAvailabilityDto: DoctorAvailabilityDto,
  ) {
    return this.appointmentService.getDoctorAvailability(
      id,
      doctorAvailabilityDto,
    );
  }
}
