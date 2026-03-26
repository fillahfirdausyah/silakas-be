import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
    UpayaHukumEntity,
    UpayaHukumType,
} from '../../../../entities/upaya-hukum.entity';

@Injectable()
export class UpayaHukumRepository {
    constructor(
        @InjectRepository(UpayaHukumEntity)
        private readonly upayaHukumRepository: Repository<UpayaHukumEntity>,
    ) {}

    findByType(type: UpayaHukumType) {
        return this.upayaHukumRepository.find({
            where: { type },
            relations: [
                'lawsuit',
                'lawsuit.pp',
                'lawsuit.js',
                'lawsuit.documentClassification',
            ],
            order: { createdAt: 'DESC' },
        });
    }

    findById(id: string) {
        return this.upayaHukumRepository.findOne({
            where: { id },
            relations: [
                'lawsuit',
                'lawsuit.pp',
                'lawsuit.js',
                'lawsuit.documentClassification',
            ],
        });
    }

    findByIds(ids: string[]) {
        return this.upayaHukumRepository.find({
            where: { id: In(ids) },
            relations: [
                'lawsuit',
                'lawsuit.pp',
                'lawsuit.js',
                'lawsuit.documentClassification',
            ],
        });
    }

    findByLawsuitId(lawsuitId: string) {
        return this.upayaHukumRepository.findOne({
            where: { lawsuitId },
            relations: ['lawsuit'],
        });
    }

    create(data: Partial<UpayaHukumEntity>) {
        const upayaHukum = this.upayaHukumRepository.create(data);
        return this.upayaHukumRepository.save(upayaHukum);
    }

    save(upayaHukum: UpayaHukumEntity) {
        return this.upayaHukumRepository.save(upayaHukum);
    }
}
