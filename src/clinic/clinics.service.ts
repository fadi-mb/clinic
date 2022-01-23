import {
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClinicDocument, Clinic } from './clinic.schema';
import CreateClinicDto, { UpdateClinicDto } from './dto/create-clinic.dto';
import { InjectConnection } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import UsersService from 'src/users/users.service';
import Role from 'src/common/emuns/role.enum';
import MongoError from 'src/utils/mongoError.enum';
import { User } from 'src/users/user.schema';
import CreateUserDto from 'src/users/dto/create-user.dto';

@Injectable()
export class ClinicsService {
  constructor(
    @InjectModel(Clinic.name) private clinicModel: Model<ClinicDocument>,
    private userService: UsersService,
    @InjectConnection() private readonly connection: mongoose.Connection,
  ) {}

  async findAll(
    documentsToSkip = 0,
    limitOfDocuments?: number,
    startId?: string,
    searchQuery?: string,
  ) {
    const filters: mongoose.FilterQuery<ClinicDocument> = startId
      ? {
          _id: {
            $gt: startId,
          },
        }
      : {};

    if (searchQuery) {
      filters.name = {
        $regex: `.*${searchQuery}.*`,
      };
    }

    const findQuery = this.clinicModel
      .find(filters)
      .sort({ _id: 1 })
      .skip(documentsToSkip)
      .populate('admin')
      .populate('doctors');

    if (limitOfDocuments) {
      findQuery.limit(limitOfDocuments);
    }

    const data = await findQuery;
    const count = await this.clinicModel.count();

    return { data, count };
  }

  async getById(user: User | undefined, clinicId: string) {
    const clinic = await this.clinicModel
      .findById(clinicId)
      .populate({
        path: 'admin',
      })
      .populate({ path: 'doctors' });

    if (!clinic) {
      throw new NotFoundException('Clinic');
    }

    if (user && clinic.adminId.toString() !== user._id.toString())
      throw new ForbiddenException();
    return clinic;
  }

  async create(clinicData: CreateClinicDto) {
    const session = await this.connection.startSession();

    session.startTransaction();
    try {
      if (!clinicData.admin.email) clinicData.admin.email = clinicData.email;
      clinicData.admin.city = clinicData.city;
      clinicData.admin.street = clinicData.street;

      const admin = await this.userService.create(
        clinicData.admin,
        Role.ClinicAdmin,
        session,
      );
      const createdClinic = new this.clinicModel({
        ...clinicData,
        adminId: admin.id,
      });

      const clinic = await createdClinic.save({ session });
      admin.clinicId = clinic._id.toString();
      await admin.save({ session });
      await session.commitTransaction();

      return await this.clinicModel.findById(clinic._id).populate({
        path: 'admin',
      });
    } catch (error: any) {
      await session.abortTransaction();
      if (error?.code === MongoError.DuplicateKey) {
        throw new ConflictException('Clinic with that email already exists');
      }
      throw error;
    } finally {
      session.endSession();
    }
  }

  async update(user: User, clinicId: string, clinicData: UpdateClinicDto) {
    const session = await this.connection.startSession();

    session.startTransaction();
    try {
      const clinic = await this.clinicModel.findById(clinicId, undefined, {
        session,
      });

      if (!clinic) throw new NotFoundException('Clinic');

      if (clinic.adminId.toString() !== user._id.toString())
        throw new ForbiddenException();

      Object.assign(clinic, clinicData);
      await clinic.save({ session });
      await session.commitTransaction();
      return this.getById(user, clinicId);
    } catch (error: any) {
      await session.abortTransaction();
      if (error?.code === MongoError.DuplicateKey) {
        throw new ConflictException('Clinic with that email already exists');
      }
      throw error;
    } finally {
      session.endSession();
    }
  }

  async addDoctor(user: User, clinicId: string, doctorData: CreateUserDto) {
    const session = await this.connection.startSession();

    session.startTransaction();
    try {
      const doctor = await this.userService.create(
        { ...doctorData, clinicId },
        Role.Doctor,
        session,
      );

      const clinic = await this.clinicModel.findByIdAndUpdate(
        {
          _id: clinicId,
        },
        {
          $push: {
            doctors: doctor._id,
          },
        },
      );

      if (!clinic) throw new NotFoundException('Clinic');

      if (clinic.adminId.toString() !== user._id.toString())
        throw new ForbiddenException();

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
    return this.getById(user, clinicId);
  }

  async removeDoctor(user: User, clinicId: string, doctorId: string) {
    const session = await this.connection.startSession();

    session.startTransaction();
    try {
      const { nModified } = await this.clinicModel.updateMany(
        { _id: clinicId },
        { $pull: { doctors: { $in: doctorId } } },
        { session },
      );

      if (nModified) {
        await this.userService.delete(doctorId);
      } else throw new NotFoundException('Clinic');

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
    return this.getById(user, clinicId);
  }

  // async delete(clinicId: string) {
  //   const session = await this.connection.startSession();

  //   session.startTransaction();
  //   try {
  //     const clinic = await this.clinicModel
  //       .findByIdAndDelete(clinicId)
  //       .populate('posts')
  //       .session(session);

  //     if (!clinic) {
  //       throw new NotFoundException();
  //     }
  //     const posts = clinic.posts;

  //     await this.postsService.deleteMany(
  //       posts.map((post) => post._id.toString()),
  //       session,
  //     );
  //     await session.commitTransaction();
  //   } catch (error) {
  //     await session.abortTransaction();
  //     throw error;
  //   } finally {
  //     session.endSession();
  //   }
  // }
}

export default ClinicsService;
