/* eslint-disable prettier/prettier */
// import { Injectable, ExecutionContext } from '@nestjs/common';
// import { AuthGuard } from '@nestjs/passport';
// import { Reflector } from '@nestjs/core';
// import { IS_PUBLIC_KEY } from '../decorator/public.decorator';
 

// @Injectable()
// export class JwtAuthGuard extends AuthGuard('jwt') {
//   constructor(private reflector: Reflector) {
//     super();
//   }

//   canActivate(context: ExecutionContext) {
//     const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
//       context.getHandler(),
//       context.getClass(),
//     ]);

//     if (isPublic) {
//       return true; // Bypass authentication
//     }

//     return super.canActivate(context); // Apply JWT authentication
//   }
// }




import { Injectable, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { IS_PUBLIC_KEY } from "../decorator/public.decorator";



@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    /* 🔎 LOG THE INCOMING HEADER */
    const req = context.switchToHttp().getRequest();
    console.log('✅ JwtAuthGuard → Authorization header:', req.headers.authorization);

    /* ---- public‑route bypass logic -------------- */
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) return true;      // no JWT required

    /* ---- run Passport 'jwt' strategy ------------ */
    return super.canActivate(context); // will attach request.user
  }
}
