import { Body, Controller, Ip, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { LoginDto, RefreshTokenDto } from '../dtos/auth.dto';

import { AuthService } from '../services/auth.service';

@ApiTags('Auth')
@Controller({
    path: 'auth',
    version: '1',
})
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('/login')
    async signIn(
        @Body() body: LoginDto,
        @Req() req: Request,
        @Ip() ip: string,
    ) {
        const result = await this.authService.login({
            email: body.email,
            password: body.password,
            rememberMe: body.rememberMe ?? false,
            deviceInfo: req.headers['user-agent'],
            ipAddress: ip,
        });

        return {
            message: 'Berhasil masuk',
            payload: result.payload,
        };
    }

    @Post('/refresh')
    async refreshToken(@Body() body: RefreshTokenDto) {
        const result = await this.authService.refreshToken(body.refreshToken);

        return {
            message: 'Token berhasil diperbarui',
            payload: result.payload,
        };
    }

    @Post('/logout')
    async logout(@Body() body: RefreshTokenDto) {
        await this.authService.logout(body.refreshToken);

        return {
            message: 'Berhasil keluar',
        };
    }
}
