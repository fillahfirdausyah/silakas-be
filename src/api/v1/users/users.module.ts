import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { UserEntity } from '../../../entities/user.entity';
import { RoleEntity } from '../../../entities/role.entity';
import { DocumentEntity } from '../../../entities/document.entity';
import { CaseTypeEntity } from '../../../entities/case-type.entity';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
import { UsersRepository } from './repositories/users.repository';
import { AuthGuard } from '../auth/guards/auth.guard';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            UserEntity,
            RoleEntity,
            DocumentEntity,
            CaseTypeEntity,
        ]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get('jwtSecret'),
            }),
        }),
    ],
    controllers: [UsersController],
    providers: [UsersService, UsersRepository, AuthGuard],
    exports: [UsersService, UsersRepository],
})
export class UsersModule {}
