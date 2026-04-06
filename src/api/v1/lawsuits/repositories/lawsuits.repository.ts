import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
    LawsuitEntity,
    LawsuitStatus,
    LawsuitType,
} from '../../../../entities/lawsuit.entity';

@Injectable()
export class LawsuitsRepository {
    constructor(
        @InjectRepository(LawsuitEntity)
        private readonly lawsuitsRepository: Repository<LawsuitEntity>,
    ) {}

    findByPagination(metadata: {
        page: number;
        limit: number;
        search: string;
        sortBy: string;
        sortType: string;
        type?: LawsuitType;
        status?: LawsuitStatus;
        startDate?: string;
        endDate?: string;
        bhtStartDate?: string;
        bhtEndDate?: string;
        ppId?: string;
    }) {
        const offset =
            metadata.page > 1 ? metadata.limit * (metadata.page - 1) : 0;

        const qb = this.lawsuitsRepository
            .createQueryBuilder('lawsuit')
            .leftJoinAndSelect('lawsuit.pp', 'pp')
            .leftJoinAndSelect('lawsuit.js', 'js')
            .leftJoinAndSelect('lawsuit.panmudGugatan', 'panmudGugatan')
            .leftJoinAndSelect('lawsuit.panmudPermohonan', 'panmudPermohonan')
            .leftJoinAndSelect('lawsuit.panmudHukum', 'panmudHukum')
            .leftJoinAndSelect(
                'lawsuit.documentClassification',
                'documentClassification',
            )
            .leftJoin('lawsuit.upayaHukum', 'upayaHukum');

        // Filter lawsuits without upayaHukum (inverse-side relation check)
        qb.where('upayaHukum.id IS NULL');

        // Apply search filter
        if (metadata.search) {
            qb.andWhere(
                '(LOWER(lawsuit.caseNumber) LIKE LOWER(:search) OR LOWER(lawsuit.classification) LIKE LOWER(:search))',
                { search: `%${metadata.search}%` },
            );
        }

        // Apply type filter
        if (metadata.type) {
            qb.andWhere('lawsuit.type = :type', { type: metadata.type });
        }

        // Apply status filter
        if (metadata.status) {
            qb.andWhere('lawsuit.status = :status', {
                status: metadata.status,
            });
        }

        // Apply ppId filter
        if (metadata.ppId) {
            qb.andWhere('pp.id = :ppId', { ppId: metadata.ppId });
        }

        // Apply decision date range filter (DATE column - use string comparison to avoid timezone issues)
        if (metadata.startDate && metadata.endDate) {
            qb.andWhere(
                'DATE(lawsuit.decisionDate) BETWEEN :startDate AND :endDate',
                {
                    startDate: metadata.startDate,
                    endDate: metadata.endDate,
                },
            );
        } else if (metadata.startDate) {
            qb.andWhere('DATE(lawsuit.decisionDate) >= :startDate', {
                startDate: metadata.startDate,
            });
        } else if (metadata.endDate) {
            qb.andWhere('DATE(lawsuit.decisionDate) <= :endDate', {
                endDate: metadata.endDate,
            });
        }

        // Apply BHT date range filter (DATE column - use string comparison to avoid timezone issues)
        if (metadata.bhtStartDate && metadata.bhtEndDate) {
            qb.andWhere(
                'DATE(lawsuit.bhtDate) BETWEEN :bhtStartDate AND :bhtEndDate',
                {
                    bhtStartDate: metadata.bhtStartDate,
                    bhtEndDate: metadata.bhtEndDate,
                },
            );
        } else if (metadata.bhtStartDate) {
            qb.andWhere('DATE(lawsuit.bhtDate) >= :bhtStartDate', {
                bhtStartDate: metadata.bhtStartDate,
            });
        } else if (metadata.bhtEndDate) {
            qb.andWhere('DATE(lawsuit.bhtDate) <= :bhtEndDate', {
                bhtEndDate: metadata.bhtEndDate,
            });
        }

        // Apply sorting
        qb.orderBy(
            `lawsuit.${metadata.sortBy}`,
            metadata.sortType.toUpperCase() as 'ASC' | 'DESC',
        );

        // Apply pagination
        qb.skip(offset).take(metadata.limit);

        return qb.getManyAndCount();
    }

    findById(id: string) {
        return this.lawsuitsRepository.findOne({
            where: { id },
            relations: [
                'pp',
                'js',
                'panmudGugatan',
                'panmudPermohonan',
                'panmudHukum',
                'documentClassification',
            ],
        });
    }

    findByCaseNumber(caseNumber: string) {
        return this.lawsuitsRepository.findOne({
            where: { caseNumber },
        });
    }

    findByIds(ids: string[]) {
        return this.lawsuitsRepository.find({
            where: { id: In(ids) },
            relations: [
                'pp',
                'js',
                'panmudGugatan',
                'panmudPermohonan',
                'panmudHukum',
                'documentClassification',
            ],
        });
    }

    create(data: Partial<LawsuitEntity>) {
        const lawsuit = this.lawsuitsRepository.create(data);
        return this.lawsuitsRepository.save(lawsuit);
    }

    save(lawsuit: LawsuitEntity) {
        return this.lawsuitsRepository.save(lawsuit);
    }

    softDelete(id: string) {
        return this.lawsuitsRepository.softDelete(id);
    }

    restore(id: string) {
        return this.lawsuitsRepository.restore(id);
    }

    hardDelete(id: string) {
        return this.lawsuitsRepository.delete(id);
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

        const qb = this.lawsuitsRepository
            .createQueryBuilder('lawsuit')
            .withDeleted()
            .leftJoinAndSelect('lawsuit.pp', 'pp')
            .leftJoinAndSelect(
                'lawsuit.documentClassification',
                'documentClassification',
            )
            .where('lawsuit.deletedAt IS NOT NULL');

        if (metadata.search) {
            qb.andWhere(
                '(LOWER(lawsuit.caseNumber) LIKE LOWER(:search) OR LOWER(lawsuit.classification) LIKE LOWER(:search))',
                { search: `%${metadata.search}%` },
            );
        }

        qb.orderBy(
            `lawsuit.${metadata.sortBy}`,
            metadata.sortType.toUpperCase() as 'ASC' | 'DESC',
        );

        qb.skip(offset).take(metadata.limit);

        return qb.getManyAndCount();
    }

    findDeletedById(id: string) {
        return this.lawsuitsRepository.findOne({
            where: { id },
            withDeleted: true,
            relations: ['pp', 'documentClassification'],
        });
    }
}
