import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LawsuitEntity } from '../../../entities/lawsuit.entity';
import { UpayaHukumEntity } from '../../../entities/upaya-hukum.entity';
import { UserEntity } from '../../../entities/user.entity';
import { DocumentClassificationEntity } from '../../../entities/document-classification.entity';
import { RecycleBinController } from './controllers/recycle-bin.controller';
import { RecycleBinService } from './services/recycle-bin.service';
import { LawsuitsRepository } from '../lawsuits/repositories/lawsuits.repository';
import { UpayaHukumRepository } from '../upaya-hukum/repositories/upaya-hukum.repository';
import { AuthGuard } from '../auth/guards/auth.guard';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            LawsuitEntity,
            UpayaHukumEntity,
            UserEntity,
            DocumentClassificationEntity,
        ]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get('jwtSecret'),
            }),
        }),
    ],
    controllers: [RecycleBinController],
    providers: [
        RecycleBinService,
        LawsuitsRepository,
        UpayaHukumRepository,
        AuthGuard,
    ],
})
export class RecycleBinModule {}
