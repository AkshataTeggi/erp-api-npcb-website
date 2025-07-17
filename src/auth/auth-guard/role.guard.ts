// sir

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role || !user.role.name) {
      console.warn('🚫 User or role missing in request:', user);
      return false;
    }

    const userRole = user.role.name.toLowerCase(); // case-insensitive check
    const allowed = requiredRoles.some(role => role.toLowerCase() === userRole);

    console.log(`🔐 Checking if role "${userRole}" is in [${requiredRoles.join(', ')}] →`, allowed);
    
    return allowed;
  }
}



















// import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
// import { Reflector } from '@nestjs/core';

// @Injectable()
// export class RolesGuard implements CanActivate {
//   constructor(private readonly reflector: Reflector) {}

//   canActivate(context: ExecutionContext): boolean {
//     const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
//     if (!requiredRoles || requiredRoles.length === 0) return true;

//     const request = context.switchToHttp().getRequest();
//     const user = request.user;

//     const userRole = user?.role?.toLowerCase(); // ✅ Fixed

//     if (!userRole) {
//       throw new ForbiddenException('User role is not defined');
//     }

//     const normalizedRoles = requiredRoles.map(role => role.toLowerCase());
//     const hasRole = normalizedRoles.includes(userRole);

//     if (!hasRole) {
//       throw new ForbiddenException(`Access denied for role: ${userRole}`);
//     }

//     return true;
//   }
// }
