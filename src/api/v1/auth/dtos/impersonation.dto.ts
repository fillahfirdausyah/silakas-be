import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ImpersonateRoleDto {
    @ApiProperty({
        required: true,
        description: 'Role slug to impersonate',
        example: 'panitera-pengganti',
    })
    @IsString()
    @IsNotEmpty({ message: 'Role slug is required' })
    roleSlug: string;
}

export class StopImpersonationDto {
    @ApiProperty({
        required: true,
        description: 'Current refresh token',
    })
    @IsString()
    @IsNotEmpty({ message: 'Refresh token is required' })
    refreshToken: string;
}

export class ImpersonationResponseDto {
    @ApiProperty({ description: 'User data with impersonated role' })
    user: {
        id: string;
        email: string;
        fullName: string;
        authority: string[];
        originalAuthority: string[];
        isImpersonating: boolean;
    };

    @ApiProperty({ description: 'New access token with impersonated role' })
    accessToken: string;

    @ApiProperty({ description: 'New refresh token for impersonated session' })
    refreshToken: string;

    @ApiProperty({ description: 'Original role before impersonation' })
    originalRole: string;

    @ApiProperty({ description: 'Currently impersonated role' })
    impersonatedRole: string;
}
