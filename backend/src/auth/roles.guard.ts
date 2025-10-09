import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    
    // Handle both possible structures:
    // 1. user.roles as array of strings (from JWT validateUser)
    // 2. user.roles as array of objects with role.name (from database)
    let userRoles: string[] = [];
    
    if (user?.roles) {
      if (typeof user.roles[0] === 'string') {
        // Case 1: roles is array of strings
        userRoles = user.roles;
      } else if (user.roles[0]?.role?.name) {
        // Case 2: roles is array of objects with role.name
        userRoles = user.roles.map((ur: any) => ur.role.name);
      } else if (user.roles[0]?.name) {
        // Case 3: roles is array of role objects with name
        userRoles = user.roles.map((r: any) => r.name);
      }
    }
    
    // Case-insensitive role comparison
    return requiredRoles.some((role) => 
      userRoles.some(userRole => userRole.toLowerCase() === role.toLowerCase())
    );
  }
}