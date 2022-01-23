import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClinicServiceDocument, ClinicService } from './clinic-service.schema';

import { InjectConnection } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import MongoError from 'src/utils/mongoError.enum';
import Role from 'src/common/emuns/role.enum';
import ClinicsService from 'src/clinic/clinics.service';
import { CreateClinicServiceDto } from './dto/create-service.dto';
import { User } from 'src/users/user.schema';
import UsersService from 'src/users/users.service';

@Injectable()
class ClinicServicesService {
  constructor(
    @InjectModel(ClinicService.name)
    private clinicServiceModel: Model<ClinicServiceDocument>,
    private readonly clinicsService: ClinicsService,
    private readonly usersService: UsersService,
    @InjectConnection() private readonly connection: mongoose.Connection,
  ) {}

  async findAll(
    documentsToSkip = 0,
    limitOfDocuments?: number,
    startId?: string,
    searchQuery?: string,
  ) {
    const filters: mongoose.FilterQuery<ClinicServiceDocument> = startId
      ? {
          _id: {
            $gt: startId,
          },
        }
      : {};

    if (searchQuery) {
      filters.$text = {
        $search: searchQuery,
      };
    }

    const findQuery = this.clinicServiceModel
      .find(filters)
      .select({
        doctors: -1,
        _id: 1,
        name: 1,
        description: 1,
        category: 1,
        duration: 1,
        clinicId: 1,
      })
      .sort({ _id: 1 })
      .skip(documentsToSkip)
      .populate('clinicId');

    if (limitOfDocuments) {
      findQuery.limit(limitOfDocuments);
    }

    const data = await findQuery;
    const count = await this.clinicServiceModel.count();

    return { data, count };
  }

  async getById(id: string) {
    const clinicService = await this.clinicServiceModel
      .findById(id)
      .populate({
        path: 'clinic',
      })
      .populate({
        path: 'doctors',
      });

    if (!clinicService) {
      throw new NotFoundException('Clinic Service');
    }
    return clinicService;
  }

  async create(user: User, clinicServiceData: CreateClinicServiceDto) {
    const clinic = await this.clinicsService.getById(
      undefined,
      clinicServiceData.clinicId,
    );
    if (clinic.adminId.toString() !== user._id.toString())
      throw new ForbiddenException();

    if (!clinic.serviceCategories.includes(clinicServiceData.category))
      throw new BadRequestException(
        undefined,
        `Service Category must conform with definedadmin categories:${clinic.serviceCategories}.`,
      );

    const createdClinicService = new this.clinicServiceModel(clinicServiceData);

    try {
      return await createdClinicService.save();
    } catch (error: any) {
      if (error?.code === MongoError.DuplicateKey) {
        throw new ConflictException(
          `Clinic "${clinic.name}" service with that name already exists`,
        );
      }
      throw error;
    }
  }

  async assignDoctor(user: User, doctorId: string, serviceId: string) {
    const session = await this.connection.startSession();

    session.startTransaction();

    const doctor = await this.usersService.getById(null, doctorId, session);
    const service = await this.clinicServiceModel.findById(
      serviceId,
      undefined,
      {
        session,
      },
    );

    if (!service) {
      throw new NotFoundException('Clinic Service');
    }

    if (
      service.clinicId.toString() !== user.clinicId.toString() ||
      doctor.clinicId.toString() !== user.clinicId.toString()
    )
      throw new ForbiddenException();

    if (service.doctors.find((id) => id.toString() === doctorId))
      throw new ConflictException('Doctor already assigned to this service');

    try {
      service.doctors.push(doctor._id);
      await service.save({ session });
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
    return this.getById(serviceId);
  }

  async unassignDoctor(user: User, doctorId: string, serviceId: string) {
    const session = await this.connection.startSession();

    session.startTransaction();

    const doctor = await this.usersService.getById(null, doctorId, session);
    const service = await this.clinicServiceModel.findById(
      serviceId,
      undefined,
      {
        session,
      },
    );

    if (!service) {
      throw new NotFoundException('Clinic Service');
    }

    if (
      service.clinicId.toString() !== user.clinicId.toString() ||
      doctor.clinicId.toString() !== user.clinicId.toString()
    )
      throw new ForbiddenException();

    const idx = service.doctors.findIndex((id) => id.toString() === doctorId);
    if (idx < 0)
      throw new ConflictException('Doctor not assigned to this service');

    try {
      service.doctors.splice(idx, 1);
      await service.save({ session });
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
    return this.getById(serviceId);
  }

  async delete(user: User, clinicServiceId: string) {
    const session = await this.connection.startSession();

    session.startTransaction();
    try {
      const clinicService = await this.clinicServiceModel
        .findByIdAndDelete(clinicServiceId)
        .populate({ path: 'clinic' })
        .session(session);

      if (!clinicService) {
        throw new NotFoundException('Clinic Service');
      }

      // if (clinicService.clinic.admin._id.toString() !== user._id.toString())
      //   throw new ForbiddenException();

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // async update(
  //   clinicServiceId: string,
  //   clinicServiceData: UpdateClinicServiceDto,
  // ) {
  //   const clinicService = await this.clinicServiceModel
  //     .findByIdAndUpdate(clinicServiceId, clinicServiceData)
  //     .setOptions({ overwrite: true, new: true });
  //   if (!clinicService) {
  //     throw new NotFoundException();
  //   }
  //   return clinicService;
  // }
}

export default ClinicServicesService;
