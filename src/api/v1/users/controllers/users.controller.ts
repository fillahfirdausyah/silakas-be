import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AuthGuard } from '../../auth/guards/auth.guard';
import { Roles } from '../../../../shared/decorators/roles.decorator';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { GetUsersDto } from '../dtos/users.dto';

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
    async getUsers(@Query() query: GetUsersDto) {
        const result = await this.usersService.findAll({
            page: query.page,
            limit: query.limit,
            search: query.search,
            sortBy: query.sortBy,
            sortType: query.sortType,
            roleId: query.roleId,
        });

        return {
            message: 'Pengguna berhasil diambil',
            payload: result.payload,
            metadata: result.metadata,
        };
    }

    @Get('roles')
    async getRoles() {
        const result = await this.usersService.findAllRoles();

        return {
            message: 'Role berhasil diambil',
            payload: result.payload,
        };
    }

    @Get('by-role/:slug')
    async getUsersByRole(@Param('slug') slug: string) {
        const result = await this.usersService.findByRoleSlug(slug);

        return {
            message: 'Pengguna berhasil diambil',
            payload: result.payload,
        };
    }

    @Get(':id')
    async getUser(@Param('id') id: string) {
        const result = await this.usersService.findOne(id);

        return {
            message: 'Pengguna berhasil diambil',
            payload: result.payload,
        };
    }

    @Post()
    @Roles('super-admin')
    async createUser(@Body() body: CreateUserDto) {
        const result = await this.usersService.createUser(body);

        return {
            message: 'Pengguna berhasil dibuat',
            payload: result.payload,
        };
    }

    @Put()
    @Roles('super-admin')
    async updateUser(@Body() body: UpdateUserDto) {
        const result = await this.usersService.updateUser(body);

        return {
            message: 'Pengguna berhasil diperbarui',
            payload: result.payload,
        };
    }

    @Delete(':id')
    @Roles('super-admin')
    async deleteUser(@Param('id') id: string) {
        await this.usersService.deleteUser(id);

        return {
            message: 'Pengguna berhasil dihapus',
            payload: null,
        };
    }
}
