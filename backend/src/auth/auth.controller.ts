import { Body, Controller, Get, HttpException, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  fullName: string;
}

class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    try {
      return await this.authService.register(
        registerDto.email,
        registerDto.password,
        registerDto.fullName,
      );
    } catch (error) {
      throw new HttpException('Registration failed', HttpStatus.BAD_REQUEST);
    }
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      return await this.authService.login(loginDto.email, loginDto.password);
    } catch (error) {
      if (error.message === 'Invalid credentials') {
        throw new HttpException(
          { message: 'Invalid email or password', statusCode: 401 }, 
          HttpStatus.UNAUTHORIZED
        );
      }
      throw new HttpException(
        { message: 'Login failed', statusCode: 500 }, 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Req() req: any) {
    try {
      const user = await this.authService.getCurrentUser(req.user.userId);
      return { user };
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to get user information', statusCode: 500 },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@Body() changePasswordDto: ChangePasswordDto, @Req() req: any) {
    try {
      const userId = req.user.userId;
      const result = await this.authService.changePassword(
        userId,
        changePasswordDto.currentPassword,
        changePasswordDto.newPassword,
      );
      return { message: 'Password changed successfully', success: true };
    } catch (error) {
      if (error.message === 'Invalid current password') {
        throw new HttpException(
          { message: 'Current password is incorrect', statusCode: 400 },
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        { message: 'Failed to change password', statusCode: 500 },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}