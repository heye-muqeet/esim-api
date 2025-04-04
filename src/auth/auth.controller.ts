// auth.controller.ts
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { Request } from 'express';
import { User } from 'src/user/user.entity';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('signup')
    async signUp(@Body() signUpDto: SignUpDto) {
        return this.authService.signUp(signUpDto.email, signUpDto.password);
    }

    @Post('login')
    @UseGuards(AuthGuard('local'))
    async login(@Req() req: Request) {
        return this.authService.login(req.user as User);
    }
}