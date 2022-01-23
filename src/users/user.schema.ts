import * as bcrypt from 'bcrypt';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId } from 'mongoose';
import * as mongoose from 'mongoose';
import { Exclude, Transform, Type } from 'class-transformer';
import Role from '../common/emuns/role.enum';
import { TimeInterval } from './dto/time-interval.dto';

export type UserDocument = User & Document;

@Schema({
  toJSON: {
    getters: true,
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
      delete ret._id;
      delete ret.password;
    },
  },
})
export class User {
  @Transform(({ value }) => value.toString())
  _id: mongoose.Types.ObjectId;

  @Prop({ unique: true, required: true })
  email: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  city: string;

  @Prop()
  street: string;

  fullName: string;

  @Prop()
  @Exclude()
  password: string;

  @Prop({ enum: Role, required: true, default: Role.Patient })
  role: Role;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: false,
  })
  @Transform(({ value }) => value.toString())
  clinicId: mongoose.Types.ObjectId;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ClinicsService' }],
  })
  @Transform(({ value }) =>
    value.map((e: mongoose.Schema.Types.ObjectId) => e.toString()),
  )
  serviceIds: ObjectId[];

  @Prop()
  shifts: TimeInterval[];
}

const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre<UserDocument>('save', async function (next) {
  if (this.password && this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }

  next();
});
UserSchema.index({ firstName: 'text', lastName: 'text' });

UserSchema.virtual('fullName').get(function (this: User) {
  return `${this.firstName} ${this.lastName}`;
});

UserSchema.virtual('clinic', {
  ref: 'Clinic',
  localField: 'clinicId',
  foreignField: '_id',
});

export { UserSchema };
