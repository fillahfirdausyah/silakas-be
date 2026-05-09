import {
    BadRequestException,
    ConflictException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { UserEntity } from '../../../../entities/user.entity';
import { handleServiceError } from '../../../../shared/utils/handler-service-error.util';
import { UsersRepository } from '../repositories/users.repository';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';

@Injectable()
export class UsersService {
    private logger = new Logger(UsersService.name);
    constructor(private readonly usersRepository: UsersRepository) {}

    public async findAll(metadata: {
        page: number;
        limit: number;
        search: string;
        sortBy: string;
        sortType: string;
        roleId?: string;
    }) {
        try {
            const [users, count] =
                await this.usersRepository.findByPagination(metadata);

            const maxPages = count > 0 ? Math.ceil(count / metadata.limit) : 1;

            return {
                payload: users,
                metadata: {
                    page: metadata.page,
                    limit: metadata.limit,
                    search: metadata.search,
                    sortBy: metadata.sortBy,
                    sortType: metadata.sortType,
                    maxPages,
                    total: count,
                },
            };
        } catch (error) {
            this.logger.error(error.stack || error);
            handleServiceError(error);
        }
    }

    public async findOne(id: string) {
        try {
            const user = await this.usersRepository.findById(id);
            if (!user) {
                throw new NotFoundException('Pengguna tidak ditemukan');
            }

            return {
                payload: this.serializeUser(user),
            };
        } catch (error) {
            this.logger.error(error.stack || error);
            handleServiceError(error);
        }
    }

    public async createUser(payload: CreateUserDto) {
        try {
            const existingUser = await this.usersRepository.findByEmail(
                payload.email,
            );

            if (existingUser) {
                throw new ConflictException('Email sudah digunakan');
            }

            // Validate roles exist
            const roles = await this.usersRepository.findRolesByIds(
                payload.roleIds,
            );

            if (roles.length !== payload.roleIds.length) {
                throw new NotFoundException('Beberapa role tidak ditemukan');
            }

            // Validate super-admin constraint
            const hasSuperAdmin = roles.some(
                (role) => role.slug === 'super-admin',
            );
            if (hasSuperAdmin && roles.length > 1) {
                throw new BadRequestException(
                    'Super admin hanya dapat memiliki satu role',
                );
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(payload.password, salt);

            const createdUser = await this.usersRepository.createUser({
                email: payload.email,
                fullName: payload.fullName,
                password: hashedPassword,
                roles,
            });

            return {
                payload: this.serializeUser(createdUser),
            };
        } catch (error) {
            this.logger.error(error.stack || error);
            handleServiceError(error);
        }
    }

    public async updateUser(payload: UpdateUserDto) {
        try {
            const user = await this.usersRepository.findById(payload.id);
            if (!user) {
                throw new NotFoundException('Pengguna tidak ditemukan');
            }

            if (payload.email && payload.email !== user.email) {
                const emailOwner = await this.usersRepository.findByEmail(
                    payload.email,
                );
                if (emailOwner && emailOwner.id !== user.id) {
                    throw new ConflictException('Email sudah digunakan');
                }
                user.email = payload.email;
            }

            if (payload.username && payload.username !== user.username) {
                const usernameOwner = await this.usersRepository.findByUsername(
                    payload.username,
                );
                if (usernameOwner && usernameOwner.id !== user.id) {
                    throw new ConflictException('Username sudah digunakan');
                }
                user.username = payload.username;
            }

            if (payload.fullName) {
                user.fullName = payload.fullName;
            }

            if (payload.roleIds && payload.roleIds.length > 0) {
                const roles = await this.usersRepository.findRolesByIds(
                    payload.roleIds,
                );

                if (roles.length !== payload.roleIds.length) {
                    throw new NotFoundException(
                        'Beberapa role tidak ditemukan',
                    );
                }

                // Validate super-admin constraint
                const hasSuperAdmin = roles.some(
                    (role) => role.slug === 'super-admin',
                );
                if (hasSuperAdmin && roles.length > 1) {
                    throw new BadRequestException(
                        'Super admin hanya dapat memiliki satu role',
                    );
                }

                user.roles = roles;
            }

            if (payload.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(payload.password, salt);
            }

            const updatedUser = await this.usersRepository.save(user);

            return {
                payload: this.serializeUser(updatedUser),
            };
        } catch (error) {
            this.logger.error(error.stack || error);
            handleServiceError(error);
        }
    }

    public async findAllRoles() {
        try {
            const roles = await this.usersRepository.findAllRoles();
            return {
                payload: roles,
            };
        } catch (error) {
            this.logger.error(error.stack || error);
            handleServiceError(error);
        }
    }

    public async findByRoleSlug(slug: string) {
        try {
            const users = await this.usersRepository.findByRoleSlug(slug);
            return {
                payload: users.map((user) => this.serializeUser(user)),
            };
        } catch (error) {
            this.logger.error(error.stack || error);
            handleServiceError(error);
        }
    }

    private serializeUser(user: UserEntity) {
        return {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            username: user.username ?? null,
            roles:
                user.roles?.map((role) => ({
                    id: role.id,
                    name: role.name,
                    slug: role.slug,
                })) ?? [],
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
}
