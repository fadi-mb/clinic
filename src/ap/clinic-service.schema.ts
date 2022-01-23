import * as bcrypt from 'bcrypt';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId } from 'mongoose';
import * as mongoose from 'mongoose';
import { Exclude, Transform, Type } from 'class-transformer';
import Role from '../common/emuns/role.enum';
import { User } from 'src/users/user.schema';
import { string } from '@hapi/joi';
// import { Post } from 'src/posts/post.schema';
// import { Clinic } from 'src/clinic/clinic.schema';

export type ClinicServiceDocument = ClinicService & Document;

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
export class ClinicService {
  @Transform(({ value }) => value.toString())
  _id: ObjectId;

  @Prop({ unique: false, required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  duration: Number;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true,
    unique: false,
  })
  @Transform(({ value }) => value.toString())
  clinicId: ObjectId;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: User.name }],
  })
  @Type(() => User)
  doctors: User[];
}

const ClinicServiceSchema = SchemaFactory.createForClass(ClinicService);

ClinicServiceSchema.index({ name: 'text', description: 'text' });
ClinicServiceSchema.index({ name: 1, clinicId: 1 }, { unique: true });

ClinicServiceSchema.virtual('clinic', {
  ref: 'Clinic',
  localField: 'clinicId',
  foreignField: '_id',
});

export { ClinicServiceSchema };
