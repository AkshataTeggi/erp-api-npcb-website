
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { PasswordHelper } from 'src/common/helpers/password-helper';
import { AuthorizationService } from '../authorization/authorization.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  // Helper: Build JWT payload
  private buildJwtPayload(user: any, permissions: string[]) {
    return {
      sub: user.id,
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
      role: user.role?.name || user.role,
      permissions,
    };
  }


  async login(email: string, password: string) {
  const user = await this.userService.getUserByEmail(email);
  if (!user) throw new UnauthorizedException('Invalid credentials');

  const isPasswordValid = await PasswordHelper.validatePassword(password, user.password);
  if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

  const rolePermissions = await this.authorizationService.getPermissionsForRole(user.userRoles?.[0]?.role?.id);
  const permissions = rolePermissions.map((rp) => rp.permission.name);

  const payload = this.buildJwtPayload(user, permissions);

  const accessToken = this.jwtService.sign(payload);
  const refreshToken = this.jwtService.sign({ sub: user.id }, { expiresIn: '7d' });

  const hashedRefreshToken = await PasswordHelper.hashPassword(refreshToken);
  await this.userService.updateUser(user.id, { refreshToken: hashedRefreshToken });

  const { password: _, refreshToken: __,  ...cleanUser } = user;

  return {
    accessToken,
    refreshToken,
    username: user.username, // or user.username if field is named like that
    role: cleanUser.userRoles?.[0]?.role?.name,
    roleId: cleanUser.userRoles?.[0]?.role?.id,
    rolePermissions,
    ...cleanUser,
  };
}


  // Validate token payload (used optionally in JwtStrategy)
  async validateUser(payload: {
    sub: string;
    email: string;
    roleId: string;
    permissions: string[];
  }) {
    const user = await this.userService.getUserById(payload.sub);
    if (!user) throw new UnauthorizedException('Invalid token payload');

    const { password, refreshToken, ..._user } = user;
    return {
      ..._user,
      permissions: payload.permissions || [],
    };
  }

  // Password reset request
  async requestPasswordReset(email: string) {
    const user = await this.userService.getUserByEmail(email);
    if (!user) throw new UnauthorizedException('User not found');

    const resetToken = this.jwtService.sign({ sub: user.id }, { expiresIn: '15m' });

    // TODO: Send resetToken via email
    console.log(`Password reset token for ${email}: ${resetToken}`);
    return { message: 'Password reset email sent', resetToken };
  }

  // Reset the password using token
  async resetPassword(resetToken: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify(resetToken);
      const user = await this.userService.getUserById(payload.sub);
      if (!user) throw new UnauthorizedException('Invalid token');

      const hashedPassword = await PasswordHelper.hashPassword(newPassword);
      await this.userService.updateUser(user.id, { password: hashedPassword });
      return { message: 'Password successfully reset' };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  // Refresh access token
  async refreshToken(userId: string, refreshToken: string) {
    const user = await this.userService.getUserById(userId);
    if (!user || !user.refreshToken) throw new UnauthorizedException('Invalid refresh token');

    const isTokenValid = await PasswordHelper.validatePassword(refreshToken, user.refreshToken);
    if (!isTokenValid) throw new UnauthorizedException('Invalid refresh token');

    const rolePermissions = await this.authorizationService.getPermissionsForRole(user.userRoles?.[0]?.role?.id);
    const permissions = rolePermissions.map((rp) => rp.permission.name);

    const payload = this.buildJwtPayload(user, permissions);
    const newAccessToken = this.jwtService.sign(payload);

    return { accessToken: newAccessToken };
  }

  // Get currently logged-in user (for /me)
  async me(userId: string) {
    const user = await this.userService.getUserById(userId);
    if (!user) throw new UnauthorizedException('Invalid token payload');

    const rolePermissions = await this.authorizationService.getPermissionsForRole(user.userRoles?.[0]?.role?.id);
    const permissions = rolePermissions.map((rp) => rp.permission.name);

    const { password, refreshToken, ..._user } = user;
    return {
      ..._user,
      permissions,
    };
  }
}