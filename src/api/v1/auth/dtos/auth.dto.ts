import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
    @IsEmail({}, { message: 'Email is invalid' })
    email: string;

    @IsNotEmpty({ message: 'Password is required' })
    password: string;
}
