import Role from '../emuns/role.enum';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  mixin,
  Type,
} from '@nestjs/common';
import RequestWithUser from '../../authentication/interfaces/request-with-user.interface';
import JwtAuthenticationGuard from '../../authentication/guards/jwt-authentication.guard';

const RoleGuard = (role: Role): Type<CanActivate> => {
  class RoleGuardMixin extends JwtAuthenticationGuard {
    async canActivate(context: ExecutionContext) {
      const request = context.switchToHttp().getRequest<RequestWithUser>();
      await super.canActivate(context);

      const user = request.user;
      return user.role === role;
    }
  }

  return mixin(RoleGuardMixin);
};

export default RoleGuard;
