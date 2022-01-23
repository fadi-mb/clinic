import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Model } from 'mongoose';
import { Clinic, ClinicDocument } from 'src/clinic/clinic.schema';
import { User } from 'src/users/user.schema';
import UsersService from 'src/users/users.service';
import MongoError from 'src/utils/mongoError.enum';
import { ClinicService, ClinicServiceDocument } from './clinic-service.schema';
import CreateClinicServiceDto from './dto/create-service.dto';
import ClinicServiceFilterDto from './dto/service-filter.dto';
import UpdateClinicServiceDto from './dto/update-service.dto';

@Injectable()
class ClinicServicesService {
  constructor(
    @InjectModel(ClinicService.name)
    private clinicServiceModel: Model<ClinicServiceDocument>,
    @InjectModel(Clinic.name)
    private clinicModel: Model<ClinicDocument>,
    private readonly usersService: UsersService,
    @InjectConnection() private readonly connection: mongoose.Connection,
  ) {}

  async findAll(
    serviceFilter: ClinicServiceFilterDto,
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

    if (serviceFilter.clinicId)
      filters.clinicId = new mongoose.Types.ObjectId(serviceFilter.clinicId);
    if (serviceFilter.doctorId)
      filters.doctorIds = {
        $elemMatch: {
          $eq: new mongoose.Types.ObjectId(serviceFilter.doctorId),
        },
      };
    if (serviceFilter.category) filters.category = serviceFilter.category;

    if (searchQuery) {
      filters.$text = {
        $search: searchQuery,
      };
    }

    const findQuery = this.clinicServiceModel
      .find(filters)
      .sort({ _id: 1 })
      .skip(documentsToSkip);

    if (limitOfDocuments) {
      findQuery.limit(limitOfDocuments);
    }

    const data = await findQuery;
    const count = await this.clinicServiceModel.count();

    return { data, count };
  }

  async getById(id: string) {
    const clinicService = await this.clinicServiceModel.findById(id).populate({
      path: 'clinic',
    });

    if (!clinicService) {
      throw new NotFoundException('Clinic Service');
    }
    return clinicService;
  }

  async create(user: User, clinicServiceData: CreateClinicServiceDto) {
    const clinic = await this.clinicModel.findById(clinicServiceData.clinicId);
    if (!clinic) throw new NotFoundException('Clinic');
    if (clinic.adminId.toString() !== user._id.toString())
      throw new ForbiddenException('Only the clinic admin is authorized.');

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
      throw new ForbiddenException(
        'Only the clinic admin is authorized on clinic services and doctors.',
      );

    if (service.doctorIds.find((id) => id.toString() === doctorId))
      throw new ConflictException('Doctor already assigned to this service');

    try {
      service.doctorIds.push(doctor._id);
      doctor.serviceIds.push(service._id);
      await service.save({ session });
      await doctor.save({ session });
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
      throw new ForbiddenException(
        'Only the clinic admin is authorized on clinic services and doctors.',
      );

    const idx = service.doctorIds.findIndex((id) => id.toString() === doctorId);
    if (idx < 0)
      throw new ConflictException('Doctor not assigned to this service');

    try {
      service.doctorIds.splice(idx, 1);
      const serviceIdx = doctor.serviceIds.findIndex(
        (id) => id.toString() === serviceId,
      );
      if (idx > -1) doctor.serviceIds.splice(serviceIdx, 1);
      await service.save({ session });
      await doctor.save({ session });
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

      if (clinicService.clinic.adminId.toString() !== user._id.toString())
        throw new ForbiddenException(
          'Only the clinic admin is authorized on clinic services .',
        );

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async update(
    user: User,
    clinicServiceId: string,
    clinicServiceData: UpdateClinicServiceDto,
  ) {
    const session = await this.connection.startSession();

    let clinicService;

    session.startTransaction();
    try {
      clinicService = await this.clinicServiceModel
        .findById(clinicServiceId)
        .populate('clinic')
        .session(session);

      if (!clinicService) {
        throw new NotFoundException();
      }

      if (clinicService.clinic.adminId.toString() !== user._id.toString())
        throw new ForbiddenException(
          'Only the clinic admin is authorized on clinic services .',
        );
      Object.assign(clinicService, clinicServiceData);
      await clinicService.save({ session });
      await session.commitTransaction();
    } catch (error: any) {
      await session.abortTransaction();

      if (error?.code === MongoError.DuplicateKey) {
        throw new ConflictException(
          `Clinic "${clinicService?.clinic.name}" service with that name already exists`,
        );
      }
      throw error;
    } finally {
      session.endSession();
    }

    return clinicService;
  }
}

export default ClinicServicesService;
