import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LawsuitEntity } from '../../../entities/lawsuit.entity';
import { UpayaHukumEntity } from '../../../entities/upaya-hukum.entity';
import { PublicController } from './controllers/public.controller';
import { PublicService } from './services/public.service';
import { PublicRepository } from './repositories/public.repository';

@Module({
    imports: [TypeOrmModule.forFeature([LawsuitEntity, UpayaHukumEntity])],
    controllers: [PublicController],
    providers: [PublicService, PublicRepository],
})
export class PublicModule {}
