import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly roleHierarchy: Record<string, number> = {
    super_admin: 4,
    admin: 3,
    manager: 2,
    rep: 1,
  };

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.role) {
      return false;
    }

    const userRoleLevel = this.roleHierarchy[user.role] || 0;
    const requiredRoleLevel = Math.min(
      ...requiredRoles.map((role) => this.roleHierarchy[role] || 0),
    );

    return userRoleLevel >= requiredRoleLevel;
  }
}
