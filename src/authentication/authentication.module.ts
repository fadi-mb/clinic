import { Global, Module } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { UsersModule } from '../users/users.module';
import { AuthenticationController } from './authentication.controller';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './startegies/local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './startegies/jwt.strategy';
import RoleGuard from '../common/guards/role.guard';
import JwtAuthenticationGuard from './guards/jwt-authentication.guard';
import { RolesGuard } from './guards/role.guard';

@Global()
@Module({
  imports: [
    UsersModule,
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: `${configService.get('JWT_EXPIRATION_TIME')}s`,
        },
      }),
    }),
  ],
  providers: [
    AuthenticationService,
    LocalStrategy,
    JwtStrategy,
    JwtAuthenticationGuard,
    RolesGuard,
  ],
  controllers: [AuthenticationController],
  exports: [JwtAuthenticationGuard, RolesGuard],
})
export class AuthenticationModule {}
