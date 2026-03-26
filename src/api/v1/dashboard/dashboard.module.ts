import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { LawsuitEntity } from '../../../entities/lawsuit.entity';
import { UpayaHukumEntity } from '../../../entities/upaya-hukum.entity';
import { DashboardController } from './controllers/dashboard.controller';
import { DashboardService } from './services/dashboard.service';
import { DashboardRepository } from './repositories/dashboard.repository';
import { AuthGuard } from '../auth/guards/auth.guard';

@Module({
    imports: [
        TypeOrmModule.forFeature([LawsuitEntity, UpayaHukumEntity]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get('jwtSecret'),
            }),
        }),
    ],
    controllers: [DashboardController],
    providers: [DashboardService, DashboardRepository, AuthGuard],
})
export class DashboardModule {}
