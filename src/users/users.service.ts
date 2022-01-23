import {
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument, User } from './user.schema';
import CreateUserDto, {
  CreateClinicMemberDto,
  UpdateUserDto,
} from './dto/create-user.dto';
import { InjectConnection } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import MongoError from 'src/utils/mongoError.enum';
import Role from 'src/common/emuns/role.enum';
import { TimeInterval, TimeIntervals } from './dto/time-interval.dto';

@Injectable()
class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectConnection() private readonly connection: mongoose.Connection,
  ) {}

  async getByEmail(email: string) {
    const user = await this.userModel.findOne({ email }).populate({
      path: 'posts',
      populate: {
        path: 'categories',
      },
    });

    if (!user) {
      throw new NotFoundException('User');
    }

    return user;
  }

  async findAll() {
    const user = await this.userModel.find().populate({
      path: 'posts',
      populate: {
        path: 'categories',
      },
    });

    if (!user) {
      throw new NotFoundException('User');
    }

    return user;
  }

  async getById(
    currentUser: User | null,
    id: string,
    session: mongoose.ClientSession | null,
  ) {
    const user = await this.userModel
      .findById(id)
      .populate({
        path: 'clinic',
        // populate: {
        //   path: 'categories',
        // },
      })
      .session(session);

    if (!user) {
      throw new NotFoundException('User');
    }

    if (currentUser) {
      if (
        !(
          (currentUser.role === Role.ClinicAdmin &&
            currentUser.clinicId.toString() === user.clinicId.toString()) ||
          currentUser._id.toString() === id
        )
      )
        throw new ForbiddenException();
    }
    return user;
  }

  async getUserForAuth(id: string) {
    const user = await this.userModel.findById(id).populate({
      path: 'clinic',
      // populate: {
      //   path: 'categories',
      // },
    });

    return user;
  }

  async create(
    userData: CreateClinicMemberDto | CreateUserDto,
    role: Role,
    session: mongoose.ClientSession | undefined,
  ) {
    const createdUser = new this.userModel({ ...userData, role });
    return createdUser.save({ session }).catch((error) => {
      if (error?.code === MongoError.DuplicateKey) {
        throw new ConflictException('User with that email already exists');
      }
      throw error;
    });
  }

  async delete(userId: string) {
    const session = await this.connection.startSession();

    session.startTransaction();
    try {
      const user = await this.userModel
        .findByIdAndDelete(userId)
        // .populate('posts')
        .session(session);

      if (!user) {
        throw new NotFoundException('User');
      }
      // const posts = user.posts;

      // await this.postsService.deleteMany(
      //   posts.map((post) => post._id.toString()),
      //   session,
      // );
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async update(userId: string, userData: UpdateUserDto) {
    const user = await this.userModel
      .findByIdAndUpdate(userId, userData)
      .setOptions({ overwrite: true, new: true });
    if (!user) {
      throw new NotFoundException('User');
    }
    return user;
  }

  async updateShifts(user: User, userId: string, shifts: TimeInterval[]) {
    const doctor = await this.userModel.findById(userId);
    if (!doctor) throw new NotFoundException('User');
    if (doctor.role !== Role.Doctor)
      throw new NotAcceptableException(
        'Operation can only be applied for doctors',
      );

    if (
      !(
        (user.role === Role.ClinicAdmin &&
          user.clinicId.toString() === doctor.clinicId.toString()) ||
        user._id.toString() === userId
      )
    )
      throw new ForbiddenException();

    if (shifts.length > 1) {
      shifts.sort((shift1, shift2) => shift1.startsAt - shift2.startsAt);

      for (let idx = 0; idx < shifts.length - 1; idx++) {
        const shift1 = shifts[idx],
          shift2 = shifts[idx + 1];
        if (shift1.startsAt >= shift1.endsAt || shift1.endsAt > shift2.startsAt)
          throw new HttpException(
            {
              message: 'Input data validation failed',
              errors: ['shifts conflict.'],
            },
            HttpStatus.BAD_REQUEST,
          );
      }
      const lastShift = shifts[shifts.length - 1];
      if (lastShift.startsAt >= lastShift.endsAt)
        throw new HttpException(
          {
            message: 'Input data validation failed',
            errors: ['shifts conflict.'],
          },
          HttpStatus.BAD_REQUEST,
        );
    }

    doctor.shifts = shifts;
    return doctor.save();
  }
}

export default UsersService;
