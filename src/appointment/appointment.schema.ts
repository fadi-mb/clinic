import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform, Type } from 'class-transformer';
import * as mongoose from 'mongoose';
import { Document, ObjectId } from 'mongoose';
import { ClinicService } from 'src/clinic-services/clinic-service.schema';
import { Clinic } from 'src/clinic/clinic.schema';
import { User } from 'src/users/user.schema';

export type AppointmentDocument = Appointment & Document;

@Schema({
  toJSON: {
    getters: true,
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
      delete ret._id;
    },
  },
})
export class Appointment {
  @Transform(({ value }) => value.toString())
  _id: mongoose.Types.ObjectId;

  @Prop({ required: true })
  startsAt: number;

  @Prop({ required: true })
  endsAt: number;

  @Prop({ required: true })
  date: Date;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClinicService',
    required: true,
    unique: false,
  })
  @Transform(({ value }) => value.toString())
  serviceId: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: false,
  })
  @Transform(({ value }) => value.toString())
  doctorId: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: false,
  })
  @Transform(({ value }) => value.toString())
  patientId: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true,
    unique: false,
  })
  @Transform(({ value }) => value.toString())
  clinicId: mongoose.Types.ObjectId;

  @Type(() => ClinicService)
  service: ClinicService;

  @Type(() => User)
  doctor: User;

  @Type(() => User)
  patient: User;

  @Type(() => Clinic)
  clinic: Clinic;
}

const AppointmentSchema = SchemaFactory.createForClass(Appointment);

AppointmentSchema.virtual('service', {
  ref: 'ClinicService',
  localField: 'serviceId',
  foreignField: '_id',
  justOne: true,
});

AppointmentSchema.virtual('clinic', {
  ref: 'Clinic',
  localField: 'clinicId',
  foreignField: '_id',
  justOne: true,
});

AppointmentSchema.virtual('doctor', {
  ref: 'User',
  localField: 'doctorId',
  foreignField: '_id',
  justOne: true,
});

AppointmentSchema.virtual('patient', {
  ref: 'User',
  localField: 'patientId',
  foreignField: '_id',
  justOne: true,
});

export { AppointmentSchema };
