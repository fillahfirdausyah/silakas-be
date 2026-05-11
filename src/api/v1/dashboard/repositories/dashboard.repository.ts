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

    /**
     * Get lawsuit detail list for statistic cards.
     * Uses same filtering logic as dashboard statistics for consistency.
     * KEY DIFFERENCE from lawsuits.repository: Does NOT exclude lawsuits with upaya hukum.
     */
    async getStatisticDetail(
        page: number,
        limit: number,
        month?: number,
        year?: number,
        userId?: string,
        roles?: string[],
        viewAsRole?: string,
        status?: LawsuitStatus[],
        type?: LawsuitType,
        excludeStatuses?: LawsuitStatus[],
        hasUpayaHukum?: boolean,
    ) {
        const qb = this.lawsuitRepo
            .createQueryBuilder('lawsuit')
            .leftJoinAndSelect('lawsuit.pp', 'pp')
            .leftJoinAndSelect('lawsuit.js', 'js')
            .leftJoinAndSelect('lawsuit.panmudGugatan', 'panmudGugatan')
            .leftJoinAndSelect('lawsuit.panmudPermohonan', 'panmudPermohonan')
            .leftJoinAndSelect('lawsuit.panmudHukum', 'panmudHukum')
            .leftJoinAndSelect(
                'lawsuit.documentClassification',
                'documentClassification',
            );

        // Role-based filtering logic (same as dashboard statistics)
        if (viewAsRole === 'panitera-pengganti' && userId) {
            qb.andWhere('lawsuit.pp_id = :userId', { userId });
        } else if (
            roles?.length === 1 &&
            roles.includes('panitera-pengganti') &&
            userId
        ) {
            qb.andWhere('lawsuit.pp_id = :userId', { userId });
        }

        // Date filtering (use MySQL functions on column name)
        if (month && year) {
            qb.andWhere('MONTH(lawsuit.decision_date) = :month', { month });
            qb.andWhere('YEAR(lawsuit.decision_date) = :year', { year });
        } else if (year) {
            qb.andWhere('YEAR(lawsuit.decision_date) = :year', { year });
        }

        // Status filter (single or multiple)
        if (status && status.length > 0) {
            qb.andWhere('lawsuit.status IN (:...status)', { status });
        }

        // Type filter
        if (type) {
            qb.andWhere('lawsuit.type = :type', { type });
        }

        // Exclude statuses filter
        if (excludeStatuses && excludeStatuses.length > 0) {
            qb.andWhere('lawsuit.status NOT IN (:...excludeStatuses)', {
                excludeStatuses,
            });
        }

        // Has upaya hukum filter
        // NOTE: This is the key fix - we don't exclude lawsuits with upaya hukum by default
        // Only filter if explicitly requested
        if (hasUpayaHukum === true) {
            // Find lawsuits that have upaya hukum
            qb.innerJoin('lawsuit.upayaHukum', 'upayaHukum');
        } else if (hasUpayaHukum === false) {
            // Find lawsuits without upaya hukum
            qb.leftJoin('lawsuit.upayaHukum', 'upayaHukum');
            qb.andWhere('upayaHukum.id IS NULL');
        }

        // Apply sorting (use property name, not column name)
        qb.orderBy('lawsuit.createdAt', 'DESC');

        // Apply pagination
        const offset = page > 1 ? limit * (page - 1) : 0;
        qb.skip(offset).take(limit);

        // Use getManyAndCount for pagination info
        const [data, total] = await qb.getManyAndCount();

        return {
            data,
            total,
            page,
            limit,
        };
    }

    async getSummary(
        month?: number,
        year?: number,
        userId?: string,
        roles?: string[],
        viewAsRole?: string,
    ) {
        const qb = this.lawsuitRepo.createQueryBuilder('l');

        // Role-based filtering logic:
        // 1. If viewAsRole is 'panitera-pengganti', filter by pp_id (multi-role user explicitly viewing as PP)
        // 2. If no viewAsRole but user has exactly 1 role which is 'panitera-pengganti', filter by pp_id (single-role PP)
        // 3. Otherwise, show all data (no filtering)
        if (viewAsRole === 'panitera-pengganti' && userId) {
            qb.andWhere('l.pp_id = :userId', { userId });
        } else if (
            roles?.length === 1 &&
            roles.includes('panitera-pengganti') &&
            userId
        ) {
            qb.andWhere('l.pp_id = :userId', { userId });
        }

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
            userId,
            roles,
            viewAsRole,
            { status: LawsuitStatus.DRAFT, type: LawsuitType.GUGATAN },
        );

        const belumDiserahkanPermohonan = await this.countByCondition(
            month,
            year,
            userId,
            roles,
            viewAsRole,
            { status: LawsuitStatus.DRAFT, type: LawsuitType.PERMOHONAN },
        );

        const sudahDiserahkanHukum = await this.countByStatusIn(
            month,
            year,
            userId,
            roles,
            viewAsRole,
            [LawsuitStatus.SUBMITTED_TO_HUKUM, LawsuitStatus.RECEIVED_BY_HUKUM],
        );

        const belumDiserahkanHukum = await this.countByStatusNotIn(
            month,
            year,
            userId,
            roles,
            viewAsRole,
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
            viewAsRole,
            { status: LawsuitStatus.RECEIVED_BY_HUKUM },
        );

        const upayaHukumAktif = await this.countUpayaHukum(
            month,
            year,
            userId,
            roles,
            viewAsRole,
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
        viewAsRole?: string,
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

        // Role-based filtering logic:
        // 1. If viewAsRole is 'panitera-pengganti', filter by pp_id
        // 2. If no viewAsRole but user has exactly 1 role which is 'panitera-pengganti', filter by pp_id
        // 3. Otherwise, show all data
        if (viewAsRole === 'panitera-pengganti' && userId) {
            qb.andWhere('l.pp_id = :userId', { userId });
        } else if (
            roles?.length === 1 &&
            roles.includes('panitera-pengganti') &&
            userId
        ) {
            qb.andWhere('l.pp_id = :userId', { userId });
        }

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

    async getTrendBulanan(
        year: number,
        userId?: string,
        roles?: string[],
        viewAsRole?: string,
    ) {
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

        // Role-based filtering logic:
        // 1. If viewAsRole is 'panitera-pengganti', filter by pp_id
        // 2. If no viewAsRole but user has exactly 1 role which is 'panitera-pengganti', filter by pp_id
        // 3. Otherwise, show all data
        if (viewAsRole === 'panitera-pengganti' && userId) {
            qb.andWhere('l.pp_id = :userId', { userId });
        } else if (
            roles?.length === 1 &&
            roles.includes('panitera-pengganti') &&
            userId
        ) {
            qb.andWhere('l.pp_id = :userId', { userId });
        }

        qb.groupBy('MONTH(l.decision_date)').orderBy(
            'MONTH(l.decision_date)',
            'ASC',
        );

        return qb.getRawMany();
    }

    private async countByCondition(
        month: number | undefined,
        year: number | undefined,
        userId: string | undefined,
        roles: string[] | undefined,
        viewAsRole: string | undefined,
        conditions: Partial<Pick<LawsuitEntity, 'status' | 'type'>>,
    ): Promise<number> {
        const qb = this.lawsuitRepo.createQueryBuilder('l');

        // Role-based filtering logic:
        // 1. If viewAsRole is 'panitera-pengganti', filter by pp_id
        // 2. If no viewAsRole but user has exactly 1 role which is 'panitera-pengganti', filter by pp_id
        // 3. Otherwise, show all data
        if (viewAsRole === 'panitera-pengganti' && userId) {
            qb.andWhere('l.pp_id = :userId', { userId });
        } else if (
            roles?.length === 1 &&
            roles.includes('panitera-pengganti') &&
            userId
        ) {
            qb.andWhere('l.pp_id = :userId', { userId });
        }

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
        userId: string | undefined,
        roles: string[] | undefined,
        viewAsRole: string | undefined,
        statuses: LawsuitStatus[],
    ): Promise<number> {
        const qb = this.lawsuitRepo
            .createQueryBuilder('l')
            .where('l.status IN (:...statuses)', { statuses });

        // Role-based filtering logic:
        // 1. If viewAsRole is 'panitera-pengganti', filter by pp_id
        // 2. If no viewAsRole but user has exactly 1 role which is 'panitera-pengganti', filter by pp_id
        // 3. Otherwise, show all data
        if (viewAsRole === 'panitera-pengganti' && userId) {
            qb.andWhere('l.pp_id = :userId', { userId });
        } else if (
            roles?.length === 1 &&
            roles.includes('panitera-pengganti') &&
            userId
        ) {
            qb.andWhere('l.pp_id = :userId', { userId });
        }

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
        userId: string | undefined,
        roles: string[] | undefined,
        viewAsRole: string | undefined,
        excludeStatuses: LawsuitStatus[],
    ): Promise<number> {
        const qb = this.lawsuitRepo
            .createQueryBuilder('l')
            .where('l.status NOT IN (:...statuses)', {
                statuses: excludeStatuses,
            });

        // Role-based filtering logic:
        // 1. If viewAsRole is 'panitera-pengganti', filter by pp_id
        // 2. If no viewAsRole but user has exactly 1 role which is 'panitera-pengganti', filter by pp_id
        // 3. Otherwise, show all data
        if (viewAsRole === 'panitera-pengganti' && userId) {
            qb.andWhere('l.pp_id = :userId', { userId });
        } else if (
            roles?.length === 1 &&
            roles.includes('panitera-pengganti') &&
            userId
        ) {
            qb.andWhere('l.pp_id = :userId', { userId });
        }

        if (month && year) {
            qb.andWhere('MONTH(l.decision_date) = :month', { month });
            qb.andWhere('YEAR(l.decision_date) = :year', { year });
        } else if (year) {
            qb.andWhere('YEAR(l.decision_date) = :year', { year });
        }

        return qb.getCount();
    }

    private async countUpayaHukum(
        month?: number,
        year?: number,
        userId?: string,
        roles?: string[],
        viewAsRole?: string,
    ): Promise<number> {
        const qb = this.upayaHukumRepo.createQueryBuilder('u');

        // Role-based filtering logic:
        // 1. If viewAsRole is 'panitera-pengganti', filter by pp_id via lawsuit join
        // 2. If no viewAsRole but user has exactly 1 role which is 'panitera-pengganti', filter by pp_id
        // 3. Otherwise, show all data
        if (viewAsRole === 'panitera-pengganti' && userId) {
            qb.innerJoin('u.lawsuit', 'l');
            qb.andWhere('l.pp_id = :userId', { userId });
        } else if (
            roles?.length === 1 &&
            roles.includes('panitera-pengganti') &&
            userId
        ) {
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
