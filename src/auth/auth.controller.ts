import { Controller, Post, Body, Request, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorator/public.decorator';
import { UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from './auth-guard/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

    @Public()
  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
  ): Promise<{ accessToken: string }> {
    return await this.authService.login(body.email, body.password);
  }

  @Get('me')
   @UseGuards(JwtAuthGuard)
  async me(@Request() req) {
    const user= req?.user;
    console.log(user)
    return await this.authService.me(req?.user?.id)
  }
   @Public()
  @Post('request-password-reset')
  async requestPasswordReset(@Body() body: { email: string }) {
    return await this.authService.requestPasswordReset(body.email);
  }


   @Public()
  @Post('reset-password')
  async resetPassword(
    @Body() body: { resetToken: string; newPassword: string },
  ) {
    return await this.authService.resetPassword(body.resetToken, body.newPassword);
  }


   @Public()
  @Post('refresh-token')
  async refreshToken(@Body() body: { userId: string; refreshToken: string }) {
    return await this.authService.refreshToken(body.userId, body.refreshToken);
  }
  @Post('logout')
async logout(): Promise<{ message: string }> {
  return { message: 'Logged out successfully' };
}

}
