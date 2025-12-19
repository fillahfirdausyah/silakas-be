import {
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
                throw new NotFoundException('User not found');
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
            const [existingUser, role] = await Promise.all([
                this.usersRepository.findByEmail(payload.email),
                this.usersRepository.findRoleById(payload.roleId),
            ]);

            if (existingUser) {
                throw new ConflictException('Email already in use');
            }

            if (!role) {
                throw new NotFoundException('Role not found');
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(payload.password, salt);

            const createdUser = await this.usersRepository.createUser({
                email: payload.email,
                fullName: payload.fullName,
                password: hashedPassword,
                role,
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
                throw new NotFoundException('User not found');
            }

            if (payload.email && payload.email !== user.email) {
                const emailOwner = await this.usersRepository.findByEmail(
                    payload.email,
                );
                if (emailOwner && emailOwner.id !== user.id) {
                    throw new ConflictException('Email already in use');
                }
                user.email = payload.email;
            }

            if (payload.fullName) {
                user.fullName = payload.fullName;
            }

            if (payload.roleId) {
                const role = await this.usersRepository.findRoleById(
                    payload.roleId,
                );
                if (!role) {
                    throw new NotFoundException('Role not found');
                }
                user.role = role;
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

    private serializeUser(user: UserEntity) {
        return {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role
                ? {
                      id: user.role.id,
                      name: user.role.name,
                      slug: user.role.slug,
                  }
                : null,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
}
