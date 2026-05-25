import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike, In } from 'typeorm';

import { RoleEntity } from '../../../../entities/role.entity';
import { UserEntity } from '../../../../entities/user.entity';

@Injectable()
export class UsersRepository {
    constructor(
        @InjectRepository(UserEntity)
        private readonly usersRepository: Repository<UserEntity>,
        @InjectRepository(RoleEntity)
        private readonly rolesRepository: Repository<RoleEntity>,
    ) {}

    findByPagination(metadata: {
        page: number;
        limit: number;
        search: string;
        sortBy: string;
        sortType: string;
        roleId?: string;
    }) {
        const offset =
            metadata.page > 1 ? metadata.limit * (metadata.page - 1) : 0;
        const baseWhere: FindOptionsWhere<UserEntity> = {};
        let where: FindOptionsWhere<UserEntity>[] = [];

        if (metadata.search) {
            const searchConditions: FindOptionsWhere<UserEntity>[] = [
                { ...baseWhere, fullName: ILike(`%${metadata.search}%`) },
                { ...baseWhere, email: ILike(`%${metadata.search}%`) },
            ];
            where = searchConditions;
        } else {
            where = [baseWhere];
        }

        // Apply role filter using many-to-many relation
        if (metadata.roleId) {
            where = where.map((w) => ({
                ...w,
                roles: { id: metadata.roleId },
            }));
        }

        const queryOptions = {
            skip: offset,
            take: metadata.limit,
            where,
            order: {
                [metadata.sortBy || 'createdAt']: metadata.sortType,
            },
            relations: ['roles'],
        };

        return this.usersRepository.findAndCount(queryOptions);
    }

    findByEmail(email: string) {
        return this.usersRepository.findOne({
            where: { email },
        });
    }

    findByUsername(username: string) {
        return this.usersRepository.findOne({
            where: { username },
        });
    }

    findById(id: string) {
        return this.usersRepository.findOne({
            where: { id },
            relations: ['roles'],
        });
    }

    createUser(data: Partial<UserEntity>) {
        const user = this.usersRepository.create(data);
        return this.usersRepository.save(user);
    }

    save(user: UserEntity) {
        return this.usersRepository.save(user);
    }

    findRoleById(id: string) {
        return this.rolesRepository.findOne({
            where: { id },
        });
    }

    findRolesByIds(ids: string[]) {
        return this.rolesRepository.find({
            where: { id: In(ids) },
        });
    }

    findAllRoles() {
        return this.rolesRepository.find();
    }

    findByRoleSlug(slug: string) {
        return this.usersRepository.find({
            where: {
                roles: { slug },
            },
            relations: ['roles'],
            order: {
                fullName: 'ASC',
            },
        });
    }

    softDelete(id: string) {
        return this.usersRepository.softDelete(id);
    }
}
