import {
  Body,
  Req,
  Controller,
  HttpCode,
  Post,
  UseGuards,
  Get,
  UseInterceptors,
} from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import SignUpDto from './dto/sign-up.dto';
import RequestWithUser from './interfaces/request-with-user.interface';
import { LocalAuthenticationGuard } from './guards/local-authentication.guard';
import { User } from '../users/user.schema';
import MongooseClassSerializerInterceptor from '../utils/mongooseClassSerializer.interceptor';
import RolesGuard from './guards/role.guard';

@Controller('authentication')
@UseInterceptors(MongooseClassSerializerInterceptor(User))
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @Post('sign-up')
  async register(@Body() registrationData: SignUpDto) {
    return this.authenticationService.register(registrationData);
  }

  @HttpCode(200)
  @UseGuards(LocalAuthenticationGuard)
  @Post('sign-in')
  async logIn(@Req() request: RequestWithUser) {
    const { user } = request;
    return {
      accessToken: this.authenticationService.signIn(user.id),
      data: user,
    };
  }

  @UseGuards(RolesGuard)
  @Get()
  authenticate(@Req() request: RequestWithUser) {
    return request.user;
  }
}
