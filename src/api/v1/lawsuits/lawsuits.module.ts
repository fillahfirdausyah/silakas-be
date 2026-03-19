import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LawsuitEntity } from '../../../entities/lawsuit.entity';
import { DocumentClassificationEntity } from '../../../entities/document-classification.entity';
import { LawsuitsController } from './controllers/lawsuits.controller';
import { LawsuitsService } from './services/lawsuits.service';
import { LawsuitsRepository } from './repositories/lawsuits.repository';
import { UsersModule } from '../users/users.module';
import { AuthGuard } from '../auth/guards/auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        TypeOrmModule.forFeature([LawsuitEntity, DocumentClassificationEntity]),
        UsersModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get('jwtSecret'),
            }),
        }),
    ],
    controllers: [LawsuitsController],
    providers: [LawsuitsService, LawsuitsRepository, AuthGuard],
    exports: [LawsuitsService, LawsuitsRepository],
})
export class LawsuitsModule {}
