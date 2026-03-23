import { Body, Controller, Ip, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { LoginDto, RefreshTokenDto } from '../dtos/auth.dto';
import {
    ImpersonateRoleDto,
    StopImpersonationDto,
} from '../dtos/impersonation.dto';

import { AuthService } from '../services/auth.service';
import { Roles } from '../../../../shared/decorators/roles.decorator';
import { AuthGuard } from '../guards/auth.guard';

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

    @Post('/impersonate')
    @UseGuards(AuthGuard)
    @Roles('super-admin')
    async impersonate(
        @Body() body: ImpersonateRoleDto,
        @Req() req: Request,
        @Ip() ip: string,
    ) {
        // Extract userId from JWT token in Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return {
                message: 'Token tidak ditemukan',
                payload: null,
            };
        }

        const token = authHeader.split(' ')[1];
        // The userId will be extracted from the token by the guard
        // For now, we need to decode it to get the userId
        const base64Payload = token.split('.')[1];
        const payload = JSON.parse(
            Buffer.from(base64Payload, 'base64').toString(),
        );
        const userId = payload.id;

        const result = await this.authService.impersonateRole({
            userId,
            targetRoleSlug: body.roleSlug,
            ipAddress: ip,
            deviceInfo: req.headers['user-agent'],
        });

        return {
            message: `Berhasil melakukan impersonasi sebagai ${body.roleSlug}`,
            payload: result.payload,
        };
    }

    @Post('/impersonate/stop')
    @UseGuards(AuthGuard)
    async stopImpersonating(
        @Body() body: StopImpersonationDto,
        @Req() req: Request,
        @Ip() ip: string,
    ) {
        // Extract userId from JWT token
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return {
                message: 'Token tidak ditemukan',
                payload: null,
            };
        }

        const token = authHeader.split(' ')[1];
        const base64Payload = token.split('.')[1];
        const payload = JSON.parse(
            Buffer.from(base64Payload, 'base64').toString(),
        );
        const userId = payload.id;

        const result = await this.authService.stopImpersonating({
            userId,
            refreshToken: body.refreshToken,
            ipAddress: ip,
            deviceInfo: req.headers['user-agent'],
        });

        return {
            message: 'Berhasil menghentikan impersonasi',
            payload: result.payload,
        };
    }
}
