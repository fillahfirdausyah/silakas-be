import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
    @ApiProperty({
        required: true,
        example: 'superadmin@elitera.com',
        description: 'Email address or username',
    })
    @IsString({ message: 'Identifier must be a string' })
    @IsNotEmpty({ message: 'Email or username is required' })
    identifier: string;

    @ApiProperty({ required: true, example: '!Password123' })
    @IsNotEmpty({ message: 'Password is required' })
    password: string;

    @ApiProperty({
        required: false,
        default: false,
        description: 'Keep user logged in for extended period',
    })
    @IsOptional()
    @IsBoolean()
    rememberMe?: boolean;
}

export class RefreshTokenDto {
    @ApiProperty({ required: true, description: 'Refresh token' })
    @IsNotEmpty({ message: 'Refresh token is required' })
    refreshToken: string;
}
