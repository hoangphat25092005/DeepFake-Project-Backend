import { Controller, Post, Body, Get, Headers, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body);
  }

  @Post('register')
  async register(@Body() body: { username: string; email: string; password: string }) {
    return this.authService.register(body);
  }

  @Get('me')
  async getMe(@Headers('authorization') authorization: string) {
    if (!authorization) {
      throw new UnauthorizedException('No token provided');
    }
    const token = authorization.replace('Bearer ', '');
    return this.authService.getMe(token);
  }
}
