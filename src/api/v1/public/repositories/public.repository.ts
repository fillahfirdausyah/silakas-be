import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    LawsuitEntity,
    LawsuitStatus,
    LawsuitType,
} from '../../../../entities/lawsuit.entity';
import { UpayaHukumEntity } from '../../../../entities/upaya-hukum.entity';

@Injectable()
export class PublicRepository {
    constructor(
        @InjectRepository(LawsuitEntity)
        private readonly lawsuitRepo: Repository<LawsuitEntity>,
        @InjectRepository(UpayaHukumEntity)
        private readonly upayaHukumRepo: Repository<UpayaHukumEntity>,
    ) {}

    async searchLawsuits(
        q: string,
        page: number,
        limit: number,
        type?: LawsuitType,
    ) {
        const offset = page > 1 ? limit * (page - 1) : 0;

        const qb = this.lawsuitRepo
            .createQueryBuilder('lawsuit')
            .leftJoinAndSelect(
                'lawsuit.documentClassification',
                'documentClassification',
            )
            .select([
                'lawsuit.id',
                'lawsuit.caseNumber',
                'lawsuit.decisionDate',
                'lawsuit.classification',
                'lawsuit.type',
                'lawsuit.status',
                'lawsuit.pbtDate',
                'lawsuit.bhtDate',
                'lawsuit.ikrarDate',
                'lawsuit.description',
                'lawsuit.createdAt',
                'documentClassification.id',
                'documentClassification.name',
                'documentClassification.code',
                'documentClassification.type',
            ]);

        if (q) {
            qb.where(
                '(LOWER(lawsuit.caseNumber) LIKE LOWER(:q) OR LOWER(lawsuit.classification) LIKE LOWER(:q) OR LOWER(lawsuit.description) LIKE LOWER(:q))',
                { q: `%${q}%` },
            );
        }

        if (type) {
            qb.andWhere('lawsuit.type = :type', { type });
        }

        qb.orderBy('lawsuit.createdAt', 'DESC');
        qb.skip(offset).take(limit);

        return qb.getManyAndCount();
    }

    async findLawsuitById(id: string) {
        return this.lawsuitRepo
            .createQueryBuilder('lawsuit')
            .leftJoinAndSelect(
                'lawsuit.documentClassification',
                'documentClassification',
            )
            .select([
                'lawsuit.id',
                'lawsuit.caseNumber',
                'lawsuit.decisionDate',
                'lawsuit.classification',
                'lawsuit.type',
                'lawsuit.status',
                'lawsuit.pbtDate',
                'lawsuit.bhtDate',
                'lawsuit.ikrarDate',
                'lawsuit.description',
                'lawsuit.createdAt',
                'lawsuit.submittedToGugatanAt',
                'lawsuit.receivedByGugatanAt',
                'lawsuit.submittedToPermohonanAt',
                'lawsuit.receivedByPermohonanAt',
                'lawsuit.submittedToHukumAt',
                'lawsuit.receivedByHukumAt',
                'documentClassification.id',
                'documentClassification.name',
                'documentClassification.code',
                'documentClassification.type',
            ])
            .where('lawsuit.id = :id', { id })
            .getOne();
    }

    async getSummary(month?: number, year?: number) {
        const qb = this.lawsuitRepo.createQueryBuilder('l');

        if (month && year) {
            qb.andWhere('MONTH(l.decision_date) = :month', { month });
            qb.andWhere('YEAR(l.decision_date) = :year', { year });
        } else if (year) {
            qb.andWhere('YEAR(l.decision_date) = :year', { year });
        }

        const totalBerkas = await qb.getCount();

        const belumDiserahkanGugatan = await this.countByCondition(
            month,
            year,
            {
                status: LawsuitStatus.DRAFT,
                type: LawsuitType.GUGATAN,
            },
        );

        const belumDiserahkanPermohonan = await this.countByCondition(
            month,
            year,
            {
                status: LawsuitStatus.DRAFT,
                type: LawsuitType.PERMOHONAN,
            },
        );

        const sudahDiserahkanHukum = await this.countByStatusIn(month, year, [
            LawsuitStatus.SUBMITTED_TO_HUKUM,
            LawsuitStatus.RECEIVED_BY_HUKUM,
        ]);

        const belumDiserahkanHukum = await this.countByStatusNotIn(
            month,
            year,
            [
                LawsuitStatus.DRAFT,
                LawsuitStatus.SUBMITTED_TO_HUKUM,
                LawsuitStatus.RECEIVED_BY_HUKUM,
            ],
        );

        const diterimaHukum = await this.countByCondition(month, year, {
            status: LawsuitStatus.RECEIVED_BY_HUKUM,
        });

        const upayaHukumAktif = await this.countUpayaHukum(month, year);

        return {
            totalBerkas,
            belumDiserahkanGugatan,
            belumDiserahkanPermohonan,
            sudahDiserahkanHukum,
            belumDiserahkanHukum,
            diterimaHukum,
            upayaHukumAktif,
        };
    }

    async getBerkasPerKlasifikasi(month?: number, year?: number) {
        const qb = this.lawsuitRepo
            .createQueryBuilder('l')
            .select('l.classification', 'classification')
            .addSelect('l.type', 'type')
            .addSelect('COUNT(*)', 'total')
            .addSelect(
                `SUM(CASE WHEN l.status = '${LawsuitStatus.DRAFT}' THEN 1 ELSE 0 END)`,
                'draft',
            )
            .addSelect(
                `SUM(CASE WHEN l.status IN ('${LawsuitStatus.SUBMITTED_TO_GUGATAN}', '${LawsuitStatus.SUBMITTED_TO_PERMOHONAN}', '${LawsuitStatus.RECEIVED_BY_GUGATAN}', '${LawsuitStatus.RECEIVED_BY_PERMOHONAN}') THEN 1 ELSE 0 END)`,
                'dalamProses',
            )
            .addSelect(
                `SUM(CASE WHEN l.status = '${LawsuitStatus.SUBMITTED_TO_HUKUM}' THEN 1 ELSE 0 END)`,
                'diserahkanHukum',
            )
            .addSelect(
                `SUM(CASE WHEN l.status = '${LawsuitStatus.RECEIVED_BY_HUKUM}' THEN 1 ELSE 0 END)`,
                'diterimaHukum',
            )
            .where('l.classification IS NOT NULL');

        if (month && year) {
            qb.andWhere('MONTH(l.decision_date) = :month', { month });
            qb.andWhere('YEAR(l.decision_date) = :year', { year });
        } else if (year) {
            qb.andWhere('YEAR(l.decision_date) = :year', { year });
        }

        return qb
            .groupBy('l.classification')
            .addGroupBy('l.type')
            .orderBy('total', 'DESC')
            .getRawMany();
    }

    async getTrendBulanan(year: number) {
        const qb = this.lawsuitRepo
            .createQueryBuilder('l')
            .select('MONTH(l.decision_date)', 'month')
            .addSelect(
                `SUM(CASE WHEN l.type = '${LawsuitType.GUGATAN}' THEN 1 ELSE 0 END)`,
                'gugatan',
            )
            .addSelect(
                `SUM(CASE WHEN l.type = '${LawsuitType.PERMOHONAN}' THEN 1 ELSE 0 END)`,
                'permohonan',
            )
            .where('YEAR(l.decision_date) = :year', { year });

        qb.groupBy('MONTH(l.decision_date)').orderBy(
            'MONTH(l.decision_date)',
            'ASC',
        );

        return qb.getRawMany();
    }

    private async countByCondition(
        month: number | undefined,
        year: number | undefined,
        conditions: Partial<Pick<LawsuitEntity, 'status' | 'type'>>,
    ): Promise<number> {
        const qb = this.lawsuitRepo.createQueryBuilder('l');

        if (conditions.status) {
            qb.andWhere('l.status = :status', { status: conditions.status });
        }
        if (conditions.type) {
            qb.andWhere('l.type = :type', { type: conditions.type });
        }

        if (month && year) {
            qb.andWhere('MONTH(l.decision_date) = :month', { month });
            qb.andWhere('YEAR(l.decision_date) = :year', { year });
        } else if (year) {
            qb.andWhere('YEAR(l.decision_date) = :year', { year });
        }

        return qb.getCount();
    }

    private async countByStatusIn(
        month: number | undefined,
        year: number | undefined,
        statuses: LawsuitStatus[],
    ): Promise<number> {
        const qb = this.lawsuitRepo
            .createQueryBuilder('l')
            .where('l.status IN (:...statuses)', { statuses });

        if (month && year) {
            qb.andWhere('MONTH(l.decision_date) = :month', { month });
            qb.andWhere('YEAR(l.decision_date) = :year', { year });
        } else if (year) {
            qb.andWhere('YEAR(l.decision_date) = :year', { year });
        }

        return qb.getCount();
    }

    private async countByStatusNotIn(
        month: number | undefined,
        year: number | undefined,
        excludeStatuses: LawsuitStatus[],
    ): Promise<number> {
        const qb = this.lawsuitRepo
            .createQueryBuilder('l')
            .where('l.status NOT IN (:...statuses)', {
                statuses: excludeStatuses,
            });

        if (month && year) {
            qb.andWhere('MONTH(l.decision_date) = :month', { month });
            qb.andWhere('YEAR(l.decision_date) = :year', { year });
        } else if (year) {
            qb.andWhere('YEAR(l.decision_date) = :year', { year });
        }

        return qb.getCount();
    }

    async getBhtHariIni() {
        const today = new Date().toISOString().split('T')[0];

        const itemsQuery = this.lawsuitRepo
            .createQueryBuilder('l')
            .select([
                'l.id',
                'l.caseNumber',
                'l.classification',
                'l.type',
                'l.bhtDate',
                'l.status',
            ])
            .where('l.bhtDate = :today', { today })
            .orderBy('l.createdAt', 'DESC');

        const chartQuery = this.lawsuitRepo
            .createQueryBuilder('l')
            .select('l.type', 'type')
            .addSelect('COUNT(*)', 'count')
            .where('l.bhtDate = :today', { today })
            .groupBy('l.type');

        const [items, chartData] = await Promise.all([
            itemsQuery.getMany(),
            chartQuery.getRawMany(),
        ]);

        return { items, chartData };
    }

    private async countUpayaHukum(
        month?: number,
        year?: number,
    ): Promise<number> {
        const qb = this.upayaHukumRepo.createQueryBuilder('u');

        if (month && year) {
            qb.andWhere('MONTH(u.created_at) = :month', { month });
            qb.andWhere('YEAR(u.created_at) = :year', { year });
        } else if (year) {
            qb.andWhere('YEAR(u.created_at) = :year', { year });
        }

        return qb.getCount();
    }
}
