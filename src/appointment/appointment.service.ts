import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  PreconditionFailedException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import * as moment from 'moment';
import * as mongoose from 'mongoose';
import { Model } from 'mongoose';
import { ClinicService } from 'src/ap/clinic-service.schema';
import { ClinicServiceDocument } from 'src/clinic-services/clinic-service.schema';
import Role from 'src/common/emuns/role.enum';
import { TimeInterval } from 'src/users/dto/time-interval.dto';
import { User, UserDocument } from 'src/users/user.schema';
import { Appointment, AppointmentDocument } from './appointment.schema';
import { AppointmentFilterDto } from './dto/appointment-filter.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Injectable()
class AppointmentService {
  constructor(
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(ClinicService.name)
    private serviceModel: Model<ClinicServiceDocument>,
    @InjectConnection() private readonly connection: mongoose.Connection,
  ) {}

  async findAll(
    user: User,
    appointmentFilter: AppointmentFilterDto,
    documentsToSkip = 0,
    limitOfDocuments?: number,
    startId?: string,
  ) {
    const filters: mongoose.FilterQuery<AppointmentDocument> = startId
      ? {
          _id: {
            $gt: startId,
          },
        }
      : {};

    if (user.role === Role.Patient)
      appointmentFilter.patientId = user._id.toString();
    if (user.role === Role.Doctor)
      appointmentFilter.doctorId = user._id.toString();

    if (appointmentFilter.date) {
      filters.date = {
        $gte: moment(appointmentFilter.date).startOf('day').toDate(),
        $lte: moment(appointmentFilter.date).endOf('day').toDate(),
      };
    }

    if (appointmentFilter.doctorId) {
      filters.doctorId = new mongoose.Types.ObjectId(
        appointmentFilter.doctorId,
      );
    }

    if (appointmentFilter.patientId) {
      filters.doctorId = new mongoose.Types.ObjectId(
        appointmentFilter.patientId,
      );
    }

    if (appointmentFilter.serviceId) {
      filters.doctorId = new mongoose.Types.ObjectId(
        appointmentFilter.serviceId,
      );
    }

    const findQuery = this.appointmentModel
      .find(filters)
      .sort({ _id: 1 })
      .skip(documentsToSkip);

    if (limitOfDocuments) {
      findQuery.limit(limitOfDocuments);
    }

    const data = await findQuery;
    const count = await this.appointmentModel.count();

    return { data, count };
  }

  async getById(user: User, id: string) {
    const appointment = await this.appointmentModel
      .findById(id)
      .populate({
        path: 'service',
      })
      .populate({
        path: 'doctor',
      })
      .populate({
        path: 'patient',
      });

    if (!appointment) {
      throw new NotFoundException('Appointment');
    }
    if (
      !(
        (user.role === Role.Patient &&
          appointment.patient._id.toString() === user._id.toString()) ||
        (user.role === Role.Doctor &&
          appointment.doctor._id.toString() === user._id.toString()) ||
        (user.role === Role.ClinicAdmin &&
          appointment.doctor.clinicId.toString() === user.clinicId.toString())
      )
    )
      throw new ForbiddenException();
    return appointment;
  }

  async create(user: User, appointmentData: CreateAppointmentDto) {
    const session = await this.connection.startSession();
    session.startTransaction();

    const [service, patient, doctor, doctorAppointments] = await Promise.all([
      this.serviceModel.findById(appointmentData.serviceId, undefined, {
        session,
      }),
      this.userModel.findById(appointmentData.patientId, undefined, {
        session,
      }),
      this.userModel.findById(appointmentData.doctorId, undefined, {
        session,
      }),
      this.appointmentModel.find(
        {
          doctorId: new mongoose.Types.ObjectId(appointmentData.doctorId),
          date: {
            $gte: moment(appointmentData.date).startOf('day').toDate(),
            $lte: moment(appointmentData.date).endOf('day').toDate(),
          },
        },
        undefined,
        {
          session,
          lean: true,
        },
      ),
    ]);

    if (!service) {
      throw new NotFoundException('Clinic Service');
    }
    if (!patient) {
      throw new NotFoundException('User "patient"');
    }
    if (!doctor) {
      throw new NotFoundException('User "doctor"');
    }

    if (user._id.toString() !== appointmentData.patientId) {
      throw new ForbiddenException(
        'Only respective patient can book appointment.',
      );
    }

    if (
      !service.doctorIds.find(
        (id) => id.toString() === appointmentData.doctorId,
      )
    ) {
      throw new PreconditionFailedException(
        'Doctor not assigned to that service',
      );
    }

    const availableIntervals: TimeInterval[] = this.getAvailableIntervals(
      doctor.shifts,
      doctorAppointments,
    );

    const interval = availableIntervals.find(
      (interval: TimeInterval) =>
        interval.startsAt <= appointmentData.startsAt &&
        interval.endsAt >= appointmentData.endsAt,
    );

    if (!interval) {
      throw new PreconditionFailedException(
        'Book A nother time',
        `available time intervals : ${availableIntervals.map(
          (ti) => `(${ti.startsAt},${ti.endsAt})`,
        )}`,
      );
    }

    const createdAppointment = new this.appointmentModel(appointmentData);

    try {
      await createdAppointment.save({ session });
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
    return createdAppointment;
  }

  getAvailableIntervals(
    shifts: TimeInterval[],
    sameDayAppointments: Appointment[],
  ): TimeInterval[] {
    const result: TimeInterval[] = [];
    const remainingAppointments: Appointment[] = [...sameDayAppointments];

    shifts.sort((shift1, shift2) => shift1.startsAt - shift2.startsAt);
    remainingAppointments.sort(
      (shift1, shift2) => shift1.startsAt - shift2.startsAt,
    );

    for (let shift of shifts) {
      const intersetion = remainingAppointments.find((appointment) => {
        appointment.startsAt >= shift.startsAt &&
          appointment.endsAt <= shift.endsAt;
      });

      if (intersetion) {
        if (shift.startsAt < intersetion.startsAt) {
          const interval = new TimeInterval();
          interval.startsAt = shift.startsAt;
          interval.endsAt = intersetion.startsAt;
          result.push(interval);
        }
        if (shift.endsAt > intersetion.endsAt) {
          const interval = new TimeInterval();
          interval.startsAt = intersetion.endsAt;
          interval.endsAt = shift.endsAt;
          result.push(interval);
        }
      } else result.push(shift);
    }
    return result;
  }
}

export default AppointmentService;
