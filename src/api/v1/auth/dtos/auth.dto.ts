import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
    @ApiProperty({ required: true, example: 'superadmin@elitera.com' })
    @IsEmail({}, { message: 'Email is invalid' })
    email: string;

    @ApiProperty({ required: true, example: '!Password123' })
    @IsNotEmpty({ message: 'Password is required' })
    password: string;
}
