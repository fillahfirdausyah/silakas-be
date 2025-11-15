import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AuthGuard } from '../../auth/guards/auth.guard';
import { Roles } from '../../../../shared/decorators/roles.decorator';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';

@ApiTags('Users')
@ApiBearerAuth('BearerAuth')
@UseGuards(AuthGuard)
@Controller({
    path: 'users',
    version: '1',
})
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get()
    async getUsers() {
        const result = await this.usersService.findAll();

        return {
            message: 'Users retrieved successfully',
            payload: result.payload,
        };
    }

    @Post()
    @Roles('super-admin')
    async createUser(@Body() body: CreateUserDto) {
        const result = await this.usersService.createUser(body);

        return {
            message: 'User created successfully',
            payload: result.payload,
        };
    }

    @Put()
    async updateUser(@Body() body: UpdateUserDto) {
        const result = await this.usersService.updateUser(body);

        return {
            message: 'User updated successfully',
            payload: result.payload,
        };
    }
}
