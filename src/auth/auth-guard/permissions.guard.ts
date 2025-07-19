// import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
// import { Reflector } from '@nestjs/core';

// @Injectable()
// export class PermissionsGuard implements CanActivate {
//   constructor(private readonly reflector: Reflector) {}

//   canActivate(context: ExecutionContext): boolean {
//     const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler());
//     if (!requiredPermissions) return true;

//     const request = context.switchToHttp().getRequest();
//     const user = request.user;

//     const userPermissions = user?.permissions || [];

//     return requiredPermissions.every(p => userPermissions.includes(p));
//   }
// }
// Enhanced Permission Guard with better error handling


// import {
//   CanActivate,
//   ExecutionContext,
//   Injectable,
//   ForbiddenException,
// } from '@nestjs/common';
// import { Reflector } from '@nestjs/core';

// @Injectable()
// export class EnhancedPermissionGuard implements CanActivate {
//   constructor(private readonly reflector: Reflector) {}

//   canActivate(context: ExecutionContext): boolean {
//     const requiredPermissions = this.reflector.get<string[]>(
//       'permissions',
//       context.getHandler(),
//     );

//     // If no permissions are required, allow access
//     if (!requiredPermissions || requiredPermissions.length === 0) {
//       return true;
//     }

//     const request = context.switchToHttp().getRequest();
//     const user = request.user;

//     if (!user) {
//       throw new ForbiddenException('Authentication required');
//     }

//     if (!user.permissions || !Array.isArray(user.permissions)) {
//       throw new ForbiddenException('User has no permissions assigned');
//     }

//     const userPermissions: string[] = user.permissions;
//     const missingPermissions = requiredPermissions.filter(
//       permission => !userPermissions.includes(permission)
//     );

//     if (missingPermissions.length > 0) {
//       throw new ForbiddenException(
//         `Access denied. Missing permissions: [${missingPermissions.join(', ')}]`
//       );
//     }

//     return true;
//   }
// }

// Enhanced Permission Guard with better error handling
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );

    // If no permissions are required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (!user.permissions || !Array.isArray(user.permissions)) {
      throw new ForbiddenException('User has no permissions assigned');
    }

    const userPermissions: string[] = user.permissions;
    const missingPermissions = requiredPermissions.filter(
      permission => !userPermissions.includes(permission)
    );

    if (missingPermissions.length > 0) {
      throw new ForbiddenException(
        `Access denied. Missing permissions: [${missingPermissions.join(', ')}]`
      );
    }

    return true;
  }
}
