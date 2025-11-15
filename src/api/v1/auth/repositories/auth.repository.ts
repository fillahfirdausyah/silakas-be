import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../../../entities/user.entity';

@Injectable()
export class AuthRepository {
    constructor(
        @InjectRepository(UserEntity)
        private readonly repository: Repository<UserEntity>,
    ) {}

    createUser(data: { email: string; password: string; fullName: string }) {
        const user = this.repository.create(data);

        return this.repository.save(user);
    }

    findByEmail(email: string, relations?: string[]) {
        return this.repository.findOne({
            where: { email },
            relations,
        });
    }

    findById(id: string) {
        return this.repository.findOne({
            where: { id },
        });
    }
}
