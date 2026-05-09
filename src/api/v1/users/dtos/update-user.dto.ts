import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsArray,
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    MinLength,
} from 'class-validator';

export class UpdateUserDto {
    @ApiProperty({ format: 'uuid' })
    @IsUUID('4', { message: 'User id must be UUID' })
    @IsNotEmpty({ message: 'User id is required' })
    id: string;

    @ApiPropertyOptional({ example: 'Jane Doe' })
    @IsOptional()
    @IsString({ message: 'Full name must be a string' })
    fullName?: string;

    @ApiPropertyOptional({ example: 'jane@elitera.com' })
    @IsOptional()
    @IsEmail({}, { message: 'Email is invalid' })
    email?: string;

    @ApiPropertyOptional({ minLength: 6 })
    @IsOptional()
    @IsString({ message: 'Password must be a string' })
    @MinLength(6, { message: 'Password must be at least 6 characters' })
    password?: string;

    @ApiPropertyOptional({ example: 'janedoe' })
    @IsOptional()
    @IsString({ message: 'Username must be a string' })
    username?: string;

    @ApiPropertyOptional({ type: [String], format: 'uuid' })
    @IsOptional()
    @IsArray({ message: 'Role ids must be an array' })
    @IsUUID('4', { each: true, message: 'Each role id must be a valid UUID' })
    roleIds?: string[];
}
