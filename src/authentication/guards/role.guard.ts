import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import JwtAuthenticationGuard from './jwt-authentication.guard';

@Injectable()
export default class RolesGuard extends JwtAuthenticationGuard {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles?.length) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return user && roles.includes(user.role);
  }
}
