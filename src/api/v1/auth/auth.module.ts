import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService, ConfigModule } from '@nestjs/config';

import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { AuthRepository } from './repositories/auth.repository';
import { ImpersonationAuditService } from '../../../shared/services/impersonation-audit.service';

import { UserEntity } from '../../../entities/user.entity';
import { RoleEntity } from '../../../entities/role.entity';
import { DocumentEntity } from '../../../entities/document.entity';
import { CaseTypeEntity } from '../../../entities/case-type.entity';
import { RefreshTokenEntity } from '../../../entities/refresh-token.entity';
import { ImpersonationAuditLogEntity } from '../../../entities/impersonation-audit-log.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            UserEntity,
            RoleEntity,
            DocumentEntity,
            CaseTypeEntity,
            RefreshTokenEntity,
            ImpersonationAuditLogEntity,
        ]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get('jwt.accessSecret'),
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, AuthRepository, ImpersonationAuditService],
})
export class AuthModule {}
