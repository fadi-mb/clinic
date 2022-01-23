import { IsMongoId } from 'class-validator';

export class ParamsWithId {
  @IsMongoId()
  id: string;
}
export class SubParamsWithId {
  @IsMongoId()
  subId: string;
}

export default ParamsWithId;
