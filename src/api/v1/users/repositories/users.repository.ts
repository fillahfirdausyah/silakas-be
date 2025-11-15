import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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

    findAll() {
        return this.usersRepository.find({
            relations: ['role'],
            order: { createdAt: 'DESC' },
        });
    }

    findByEmail(email: string) {
        return this.usersRepository.findOne({
            where: { email },
        });
    }

    findById(id: string) {
        return this.usersRepository.findOne({
            where: { id },
            relations: ['role'],
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
}
