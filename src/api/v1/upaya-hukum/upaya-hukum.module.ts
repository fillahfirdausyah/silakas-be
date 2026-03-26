import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DocumentClassificationEntity } from '../../../entities/document-classification.entity';
import { LawsuitEntity } from '../../../entities/lawsuit.entity';
import { UpayaHukumEntity } from '../../../entities/upaya-hukum.entity';
import { AuthGuard } from '../auth/guards/auth.guard';
import { LawsuitsRepository } from '../lawsuits/repositories/lawsuits.repository';
import { UsersModule } from '../users/users.module';
import { UpayaHukumController } from './controllers/upaya-hukum.controller';
import { UpayaHukumRepository } from './repositories/upaya-hukum.repository';
import { UpayaHukumService } from './services/upaya-hukum.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            UpayaHukumEntity,
            LawsuitEntity,
            DocumentClassificationEntity,
        ]),
        UsersModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get('jwtSecret'),
            }),
        }),
    ],
    controllers: [UpayaHukumController],
    providers: [
        UpayaHukumService,
        UpayaHukumRepository,
        LawsuitsRepository,
        AuthGuard,
    ],
    exports: [UpayaHukumService, UpayaHukumRepository],
})
export class UpayaHukumModule {}
