import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService, ConfigModule } from '@nestjs/config';

import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { AuthRepository } from './repositories/auth.repository';

import { UserEntity } from '../../../entities/user.entity';
import { RoleEntity } from '../../../entities/role.entity';
import { DocumentEntity } from '../../../entities/document.entity';
import { CaseTypeEntity } from '../../../entities/case-type.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([UserEntity, RoleEntity, DocumentEntity, CaseTypeEntity]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get('jwtSecret'),
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, AuthRepository],
})
export class AuthModule {}
