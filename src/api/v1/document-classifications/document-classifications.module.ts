import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { DocumentClassificationEntity } from '../../../entities/document-classification.entity';
import { DocumentClassificationsController } from './controllers/document-classifications.controller';
import { DocumentClassificationsService } from './services/document-classifications.service';
import { DocumentClassificationsRepository } from './repositories/document-classifications.repository';
import { AuthGuard } from '../auth/guards/auth.guard';

@Module({
    imports: [
        TypeOrmModule.forFeature([DocumentClassificationEntity]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get('jwtSecret'),
            }),
        }),
    ],
    controllers: [DocumentClassificationsController],
    providers: [
        DocumentClassificationsService,
        DocumentClassificationsRepository,
        AuthGuard,
    ],
    exports: [
        DocumentClassificationsService,
        DocumentClassificationsRepository,
    ],
})
export class DocumentClassificationsModule {}
