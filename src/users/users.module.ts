import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Clinic, ClinicSchema } from 'src/clinic/clinic.schema';
import { UserController } from './user.controller';
import { User, UserSchema } from './user.schema';
import UsersService from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [UsersService],
  exports: [UsersService, MongooseModule],
  controllers: [UserController],
})
export class UsersModule {}
