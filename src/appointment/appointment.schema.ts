import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform, Type } from 'class-transformer';
import * as mongoose from 'mongoose';
import { Document, ObjectId } from 'mongoose';
import { ClinicService } from 'src/ap/clinic-service.schema';
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

  @Type(() => ClinicService)
  service: ClinicService;

  @Type(() => User)
  doctor: User;

  @Type(() => User)
  patient: User;
}

const AppointmentSchema = SchemaFactory.createForClass(Appointment);

AppointmentSchema.index({ name: 'text', description: 'text' });
AppointmentSchema.index({ name: 1, clinicId: 1 }, { unique: true });

AppointmentSchema.virtual('service', {
  ref: 'ClinicService',
  localField: 'serviceId',
  foreignField: '_id',
});

AppointmentSchema.virtual('doctor', {
  ref: 'User',
  localField: 'doctorId',
  foreignField: '_id',
});

AppointmentSchema.virtual('patient', {
  ref: 'User',
  localField: 'patientId',
  foreignField: '_id',
});

export { AppointmentSchema };