
//sir

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);





// // src/auth/decorator/public.decorator.ts
// import { SetMetadata } from '@nestjs/common';

// export const IS_PUBLIC_KEY = 'isPublic';
// export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// // 👇 Optional: If you also want to define roles or permissions in this file
// export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
// export const Permissions = (...permissions: string[]) => SetMetadata('permissions', permissions);
