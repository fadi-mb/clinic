import {
  Controller,
  UseGuards,
  Get,
  UseInterceptors,
  Param,
  Body,
  Put,
  Req,
  Query,
} from '@nestjs/common';
import UserService from './users.service';
import { User } from './user.schema';
import MongooseClassSerializerInterceptor from '../utils/mongooseClassSerializer.interceptor';
import { RolesGuard } from '../authentication/guards/role.guard';
import Role from 'src/common/emuns/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UpdateUserDto } from './dto/create-user.dto';
import ParamsWithId from 'src/utils/paramsWithId';
import { TimeIntervals } from './dto/time-interval.dto';
import RequestWithUser from 'src/authentication/interfaces/request-with-user.interface';
import { PaginationParams } from 'src/utils/paginationParams';
import ListUserFilterDto from './dto/list-user-filter.dto';

@Controller('user')
@UseInterceptors(MongooseClassSerializerInterceptor(User))
@UseGuards(RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Roles(Role.ClinicAdmin, Role.Patient)
  @Get()
  listUsers(
    @Query() { skip, limit, startId }: PaginationParams,
    @Query() userFilter: ListUserFilterDto,
    @Query('searchQuery') searchQuery: string,
  ) {
    return this.userService.findAll(
      userFilter,
      skip,
      limit,
      startId,
      searchQuery,
    );
  }

  @Roles(Role.ClinicAdmin, Role.Doctor)
  @Get(':id')
  async getById(
    @Param() { id }: ParamsWithId,
    @Req() request: RequestWithUser,
  ) {
    const user = request.user;
    return this.userService.getById(user, id, null);
  }

  @Put(':id')
  async updateUser(
    @Param() { id }: ParamsWithId,
    @Body() userData: UpdateUserDto,
    @Req() request: RequestWithUser,
  ) {
    const user = request.user;
    return this.userService.update(user, id, userData);
  }

  @Roles(Role.ClinicAdmin, Role.Doctor)
  @Put(':id/shifts')
  async updateDoctorShifts(
    @Param() { id }: ParamsWithId,
    @Body() { shifts }: TimeIntervals,
    @Req() request: RequestWithUser,
  ) {
    const user = request.user;
    return this.userService.updateShifts(user, id, shifts);
  }
}
