// src/auth/payload-interface/jwt-payload.interface.ts
export interface JwtPayload {
  userId: string;
  email: string;
  sub: string;
  roleId: string;      
  role: string;         
       permissions?: string[];

}