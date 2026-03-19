import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, IsNull, LessThan, Repository } from 'typeorm';
import { UserEntity } from '../../../../entities/user.entity';
import { RefreshTokenEntity } from '../../../../entities/refresh-token.entity';

@Injectable()
export class AuthRepository {
    constructor(
        @InjectRepository(UserEntity)
        private readonly repository: Repository<UserEntity>,
        @InjectRepository(RefreshTokenEntity)
        private readonly refreshTokenRepository: Repository<RefreshTokenEntity>,
    ) {}

    createUser(data: { email: string; password: string; fullName: string }) {
        const user = this.repository.create(data);

        return this.repository.save(user);
    }

    findByEmail(email: string, relations?: string[]) {
        return this.repository.findOne({
            where: { email: Equal(email) },
            relations,
        });
    }

    findById(id: string) {
        return this.repository.findOne({
            where: { id },
        });
    }

    // Refresh Token Methods
    async saveRefreshToken(data: {
        userId: string;
        tokenHash: string;
        expiresAt: Date;
        deviceInfo?: string;
        ipAddress?: string;
    }) {
        const refreshToken = this.refreshTokenRepository.create({
            userId: data.userId,
            tokenHash: data.tokenHash,
            expiresAt: data.expiresAt,
            deviceInfo: data.deviceInfo ?? null,
            ipAddress: data.ipAddress ?? null,
            revokedAt: null,
        });

        return this.refreshTokenRepository.save(refreshToken);
    }

    async findRefreshTokenByHash(tokenHash: string) {
        return this.refreshTokenRepository.findOne({
            where: {
                tokenHash: Equal(tokenHash),
                revokedAt: IsNull(),
            },
            relations: ['user', 'user.role'],
        });
    }

    async revokeRefreshToken(tokenHash: string) {
        await this.refreshTokenRepository.update(
            { tokenHash: Equal(tokenHash) },
            { revokedAt: new Date() },
        );
    }

    async revokeAllUserTokens(userId: string) {
        await this.refreshTokenRepository.update(
            { userId: Equal(userId), revokedAt: IsNull() },
            { revokedAt: new Date() },
        );
    }

    async cleanupExpiredTokens() {
        await this.refreshTokenRepository.delete({
            expiresAt: LessThan(new Date()),
        });
    }
}
