import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsNotEmpty,
    IsString,
    IsUUID,
    MinLength,
} from 'class-validator';

export class CreateUserDto {
    @ApiProperty({ required: true, example: 'John Doe' })
    @IsString({ message: 'Full name must be a string' })
    @IsNotEmpty({ message: 'Full name is required' })
    fullName: string;

    @ApiProperty({ required: true, example: 'john@elitera.com' })
    @IsEmail({}, { message: 'Email is invalid' })
    email: string;

    @ApiProperty({ required: true, minLength: 6 })
    @IsString({ message: 'Password must be a string' })
    @MinLength(6, { message: 'Password must be at least 6 characters' })
    password: string;

    @ApiProperty({ required: true, format: 'uuid' })
    @IsUUID('4', { message: 'Role id must be UUID' })
    roleId: string;
}
