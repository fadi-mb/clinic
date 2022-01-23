import {
  ClassSerializerInterceptor,
  PlainLiteralObject,
  Type,
} from '@nestjs/common';
import { ClassTransformOptions, plainToClass } from 'class-transformer';
import { Document, Schema } from 'mongoose';

function MongooseClassSerializerInterceptor(
  classToIntercept: Type,
): typeof ClassSerializerInterceptor {
  return class Interceptor extends ClassSerializerInterceptor {
    private changePlainObjectToClass(document: PlainLiteralObject) {
      if (!(document instanceof Document)) {
        return document;
      }

      return plainToClass(
        classToIntercept,
        document.toJSON({ versionKey: false }),
      );
    }

    private prepareResponse(
      response: PlainLiteralObject | PlainLiteralObject[],
    ): PlainLiteralObject {
      if (!Array.isArray(response) && response.data) {
        const data = this.prepareResponse(response.data);
        return {
          ...response,
          data,
        };
      }

      if (Array.isArray(response)) {
        return response.map(this.changePlainObjectToClass);
      }

      return this.changePlainObjectToClass(response);
    }

    serialize(
      response: PlainLiteralObject | PlainLiteralObject[],
      options: ClassTransformOptions,
    ) {
      return super.serialize(this.prepareResponse(response), options);
    }
  };
}

export default MongooseClassSerializerInterceptor;
