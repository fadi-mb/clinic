import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId } from 'mongoose';
import * as mongoose from 'mongoose';
import { Transform, Type } from 'class-transformer';
import { User } from 'src/users/user.schema';

export type ClinicDocument = Clinic & Document;

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
export class Clinic {
  @Transform(({ value }) => value.toString())
  _id: mongoose.Types.ObjectId;

  @Prop()
  name: string;

  @Prop({ unique: true, required: true })
  email: string;

  @Prop()
  city: string;

  @Prop()
  street: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    required: true,
  })
  @Transform(({ value }) => value.toString())
  adminId: mongoose.Types.ObjectId;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: User.name }],
  })
  @Transform(({ value }) =>
    value.map((e: mongoose.Schema.Types.ObjectId) => e.toString()),
  )
  doctorIds: ObjectId[];

  @Prop({
    type: [String],
  })
  serviceCategories: string[];
}

const ClinicSchema = SchemaFactory.createForClass(Clinic);

ClinicSchema.index({ name: 'text' });

ClinicSchema.virtual('doctors', {
  ref: 'User',
  localField: 'doctorIds',
  foreignField: 'clinicId',
});

ClinicSchema.virtual('admin', {
  ref: 'User',
  localField: 'adminId',
  foreignField: '_id',
});

export { ClinicSchema };
