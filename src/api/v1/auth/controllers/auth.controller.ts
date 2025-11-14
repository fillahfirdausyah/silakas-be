import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { LoginDto } from '../dtos/auth.dto';

import { AuthService } from '../services/auth.service';

@ApiTags('Auth')
@Controller({
    path: 'auth',
    version: '1',
})
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('/login')
    async signIn(@Body() body: LoginDto) {
        const result = await this.authService.login({
            email: body.email,
            password: body.password,
        });

        return {
            message: 'Successfully signed in',
            payload: result.payload,
        };
    }
}
