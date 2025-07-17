// import { JwtModuleOptions } from '@nestjs/jwt';

// export const jwtConstants = {
//   secret: process.env.JWT_SECRET || 'yourSecretKey', // Use env variable for production
//   expiresIn: '30d', // Token validity
// };

// export const jwtConfig: JwtModuleOptions = {
//   secret: jwtConstants.secret,
//   signOptions: { expiresIn: jwtConstants.expiresIn },
// };




// export const jwtConstants = {
//   secret: process.env.JWT_SECRET || 'yourSecretKey', // Use env variable for production
//   expiresIn: '30d', // Token validity
// };

// export const jwtConfig: JwtModuleOptions = {
//   secret: jwtConstants.secret,
//   signOptions: { expiresIn: jwtConstants.expiresIn },
// };

// auth/config/jwt.config.ts

import { JwtModuleOptions } from '@nestjs/jwt';
export const jwtConstants = {
  secret: process.env.JWT_SECRET_KEY || 'yourSecretKey',
  expiresIn: '30d',
};

console.log('JWT Secret (from .env):', jwtConstants.secret); // Debug only

export const jwtConfig: JwtModuleOptions = {
  secret: jwtConstants.secret,
  signOptions: { expiresIn: jwtConstants.expiresIn },
};
