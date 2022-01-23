import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform } from 'class-transformer';
import * as mongoose from 'mongoose';
import { Document } from 'mongoose';
import { User } from 'src/users/user.schema';

export type ClinicServiceDocument = ClinicService & Document;

@Schema({
  toJSON: {
    getters: true,
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
      delete ret._id;
      ret.clinicId = String(ret.clinicId);
      ret.doctorIds = ret.doctorIds.map((id: any) => String(id));
    },
  },
})
export class ClinicService {
  @Transform(({ value }) => value.toString())
  _id: mongoose.Types.ObjectId;

  @Prop({ unique: false, required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  duration: number;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true,
    unique: false,
  })
  @Transform(({ value }) => value.toString())
  clinicId: mongoose.Types.ObjectId;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: User.name }],
  })
  @Transform(({ value }) =>
    value.map((e: mongoose.Schema.Types.ObjectId) => e.toString()),
  )
  doctorIds: mongoose.Types.ObjectId[];
}

const ClinicServiceSchema = SchemaFactory.createForClass(ClinicService);

ClinicServiceSchema.index({ name: 'text', description: 'text' });
ClinicServiceSchema.index({ name: 1, clinicId: 1 }, { unique: true });

ClinicServiceSchema.virtual('clinic', {
  ref: 'Clinic',
  localField: 'clinicId',
  foreignField: '_id',
});

ClinicServiceSchema.virtual('doctors', {
  ref: 'User',
  localField: 'doctorIds',
  foreignField: '_id',
});

export { ClinicServiceSchema };
