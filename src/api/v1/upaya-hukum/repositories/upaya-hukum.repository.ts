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

    softDelete(id: string) {
        return this.upayaHukumRepository.softDelete(id);
    }

    restore(id: string) {
        return this.upayaHukumRepository.restore(id);
    }

    hardDelete(id: string) {
        return this.upayaHukumRepository.delete(id);
    }

    findDeletedItems(metadata: {
        page: number;
        limit: number;
        search: string;
        sortBy: string;
        sortType: string;
    }) {
        const offset =
            metadata.page > 1 ? metadata.limit * (metadata.page - 1) : 0;

        const qb = this.upayaHukumRepository
            .createQueryBuilder('upayaHukum')
            .withDeleted()
            .leftJoinAndSelect('upayaHukum.lawsuit', 'lawsuit')
            .leftJoinAndSelect('lawsuit.pp', 'pp')
            .leftJoinAndSelect(
                'lawsuit.documentClassification',
                'documentClassification',
            )
            .where('upayaHukum.deletedAt IS NOT NULL');

        if (metadata.search) {
            qb.andWhere('(LOWER(lawsuit.caseNumber) LIKE LOWER(:search))', {
                search: `%${metadata.search}%`,
            });
        }

        qb.orderBy(
            `upayaHukum.${metadata.sortBy}`,
            metadata.sortType.toUpperCase() as 'ASC' | 'DESC',
        );

        qb.skip(offset).take(metadata.limit);

        return qb.getManyAndCount();
    }

    findDeletedById(id: string) {
        return this.upayaHukumRepository.findOne({
            where: { id },
            withDeleted: true,
            relations: [
                'lawsuit',
                'lawsuit.pp',
                'lawsuit.documentClassification',
            ],
        });
    }
}
