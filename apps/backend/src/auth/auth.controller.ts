import { Controller, Post, Body, Get, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('register')
  register(@Body() registerDto: any) {
    return this.authService.register(registerDto);
  }

  @Get('me')
  getProfile(@Request() req: any) {
    return {
      success: true,
      message: 'User profile retrieved successfully',
      data: req.user,
    };
  }
}
