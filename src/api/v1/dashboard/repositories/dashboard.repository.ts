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
export class DashboardRepository {
    constructor(
        @InjectRepository(LawsuitEntity)
        private readonly lawsuitRepo: Repository<LawsuitEntity>,
        @InjectRepository(UpayaHukumEntity)
        private readonly upayaHukumRepo: Repository<UpayaHukumEntity>,
    ) {}

    async getSummary(
        month?: number,
        year?: number,
        userId?: string,
        roles?: string[],
    ) {
        const qb = this.lawsuitRepo.createQueryBuilder('l');

        // Role-based filtering: Panitera Pengganti only sees their own data
        if (roles?.includes('panitera-pengganti') && userId) {
            qb.andWhere('l.pp_id = :userId', { userId });
        }

        if (month && year) {
            qb.andWhere('MONTH(l.created_at) = :month', { month });
            qb.andWhere('YEAR(l.created_at) = :year', { year });
        } else if (year) {
            qb.andWhere('YEAR(l.created_at) = :year', { year });
        }

        const totalBerkas = await qb.getCount();

        const belumDiserahkanGugatan = await this.countByCondition(
            month,
            year,
            userId,
            roles,
            { status: LawsuitStatus.DRAFT, type: LawsuitType.GUGATAN },
        );

        const belumDiserahkanPermohonan = await this.countByCondition(
            month,
            year,
            userId,
            roles,
            { status: LawsuitStatus.DRAFT, type: LawsuitType.PERMOHONAN },
        );

        const sudahDiserahkanHukum = await this.countByStatusIn(
            month,
            year,
            userId,
            roles,
            [LawsuitStatus.SUBMITTED_TO_HUKUM, LawsuitStatus.RECEIVED_BY_HUKUM],
        );

        const belumDiserahkanHukum = await this.countByStatusNotIn(
            month,
            year,
            userId,
            roles,
            [
                LawsuitStatus.DRAFT,
                LawsuitStatus.SUBMITTED_TO_HUKUM,
                LawsuitStatus.RECEIVED_BY_HUKUM,
            ],
        );

        const diterimaHukum = await this.countByCondition(
            month,
            year,
            userId,
            roles,
            { status: LawsuitStatus.RECEIVED_BY_HUKUM },
        );

        const upayaHukumAktif = await this.countUpayaHukum(
            month,
            year,
            userId,
            roles,
        );

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

    async getBerkasPerKlasifikasi(
        month?: number,
        year?: number,
        userId?: string,
        roles?: string[],
    ) {
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

        // Role-based filtering: Panitera Pengganti only sees their own data
        if (roles?.includes('panitera-pengganti') && userId) {
            qb.andWhere('l.pp_id = :userId', { userId });
        }

        if (month && year) {
            qb.andWhere('MONTH(l.created_at) = :month', { month });
            qb.andWhere('YEAR(l.created_at) = :year', { year });
        } else if (year) {
            qb.andWhere('YEAR(l.created_at) = :year', { year });
        }

        return qb
            .groupBy('l.classification')
            .addGroupBy('l.type')
            .orderBy('total', 'DESC')
            .getRawMany();
    }

    async getTrendBulanan(year: number, userId?: string, roles?: string[]) {
        const qb = this.lawsuitRepo
            .createQueryBuilder('l')
            .select('MONTH(l.created_at)', 'month')
            .addSelect(
                `SUM(CASE WHEN l.type = '${LawsuitType.GUGATAN}' THEN 1 ELSE 0 END)`,
                'gugatan',
            )
            .addSelect(
                `SUM(CASE WHEN l.type = '${LawsuitType.PERMOHONAN}' THEN 1 ELSE 0 END)`,
                'permohonan',
            )
            .where('YEAR(l.created_at) = :year', { year });

        // Role-based filtering: Panitera Pengganti only sees their own data
        if (roles?.includes('panitera-pengganti') && userId) {
            qb.andWhere('l.pp_id = :userId', { userId });
        }

        qb.groupBy('MONTH(l.created_at)').orderBy('MONTH(l.created_at)', 'ASC');

        return qb.getRawMany();
    }

    private async countByCondition(
        month: number | undefined,
        year: number | undefined,
        userId: string | undefined,
        roles: string[] | undefined,
        conditions: Partial<Pick<LawsuitEntity, 'status' | 'type'>>,
    ): Promise<number> {
        const qb = this.lawsuitRepo.createQueryBuilder('l');

        // Role-based filtering: Panitera Pengganti only sees their own data
        if (roles?.includes('panitera-pengganti') && userId) {
            qb.andWhere('l.pp_id = :userId', { userId });
        }

        if (conditions.status) {
            qb.andWhere('l.status = :status', { status: conditions.status });
        }
        if (conditions.type) {
            qb.andWhere('l.type = :type', { type: conditions.type });
        }

        if (month && year) {
            qb.andWhere('MONTH(l.created_at) = :month', { month });
            qb.andWhere('YEAR(l.created_at) = :year', { year });
        } else if (year) {
            qb.andWhere('YEAR(l.created_at) = :year', { year });
        }

        return qb.getCount();
    }

    private async countByStatusIn(
        month: number | undefined,
        year: number | undefined,
        userId: string | undefined,
        roles: string[] | undefined,
        statuses: LawsuitStatus[],
    ): Promise<number> {
        const qb = this.lawsuitRepo
            .createQueryBuilder('l')
            .where('l.status IN (:...statuses)', { statuses });

        // Role-based filtering: Panitera Pengganti only sees their own data
        if (roles?.includes('panitera-pengganti') && userId) {
            qb.andWhere('l.pp_id = :userId', { userId });
        }

        if (month && year) {
            qb.andWhere('MONTH(l.created_at) = :month', { month });
            qb.andWhere('YEAR(l.created_at) = :year', { year });
        } else if (year) {
            qb.andWhere('YEAR(l.created_at) = :year', { year });
        }

        return qb.getCount();
    }

    private async countByStatusNotIn(
        month: number | undefined,
        year: number | undefined,
        userId: string | undefined,
        roles: string[] | undefined,
        excludeStatuses: LawsuitStatus[],
    ): Promise<number> {
        const qb = this.lawsuitRepo
            .createQueryBuilder('l')
            .where('l.status NOT IN (:...statuses)', {
                statuses: excludeStatuses,
            });

        // Role-based filtering: Panitera Pengganti only sees their own data
        if (roles?.includes('panitera-pengganti') && userId) {
            qb.andWhere('l.pp_id = :userId', { userId });
        }

        if (month && year) {
            qb.andWhere('MONTH(l.created_at) = :month', { month });
            qb.andWhere('YEAR(l.created_at) = :year', { year });
        } else if (year) {
            qb.andWhere('YEAR(l.created_at) = :year', { year });
        }

        return qb.getCount();
    }

    private async countUpayaHukum(
        month?: number,
        year?: number,
        userId?: string,
        roles?: string[],
    ): Promise<number> {
        const qb = this.upayaHukumRepo.createQueryBuilder('u');

        // Role-based filtering: Panitera Pengganti only sees their own data
        // Need to join through lawsuit to filter by pp_id
        if (roles?.includes('panitera-pengganti') && userId) {
            qb.innerJoin('u.lawsuit', 'l');
            qb.andWhere('l.pp_id = :userId', { userId });
        }

        if (month && year) {
            qb.andWhere('MONTH(u.created_at) = :month', { month });
            qb.andWhere('YEAR(u.created_at) = :year', { year });
        } else if (year) {
            qb.andWhere('YEAR(u.created_at) = :year', { year });
        }

        return qb.getCount();
    }
}
