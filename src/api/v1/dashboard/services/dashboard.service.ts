import { Injectable } from '@nestjs/common';
import { DashboardRepository } from '../repositories/dashboard.repository';
import { GetDashboardDto } from '../dtos/dashboard.dto';
import { GetStatisticDetailDto } from '../dtos/get-statistic-detail.dto';
import {
    LawsuitStatus,
    LawsuitType,
} from '../../../../entities/lawsuit.entity';

@Injectable()
export class DashboardService {
    constructor(private readonly dashboardRepository: DashboardRepository) {}

    async getStatistics(
        query: GetDashboardDto,
        userId?: string,
        roles?: string[],
    ) {
        const { month, year, viewAsRole } = query;
        const resolvedYear = year ?? new Date().getFullYear();

        const [summary, berkasPerKlasifikasi, trendBulanan] = await Promise.all(
            [
                this.dashboardRepository.getSummary(
                    month,
                    resolvedYear,
                    userId,
                    roles,
                    viewAsRole,
                ),
                this.dashboardRepository.getBerkasPerKlasifikasi(
                    month,
                    resolvedYear,
                    userId,
                    roles,
                    viewAsRole,
                ),
                this.dashboardRepository.getTrendBulanan(
                    resolvedYear,
                    userId,
                    roles,
                    viewAsRole,
                ),
            ],
        );

        const monthNames = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'Mei',
            'Jun',
            'Jul',
            'Agu',
            'Sep',
            'Okt',
            'Nov',
            'Des',
        ];

        const trendFormatted = monthNames.map((name, index) => {
            const found = trendBulanan.find(
                (t: { month: number }) => t.month === index + 1,
            );
            return {
                month: name,
                gugatan: found ? Number(found.gugatan) : 0,
                permohonan: found ? Number(found.permohonan) : 0,
            };
        });

        return {
            payload: {
                summary,
                berkasPerKlasifikasi: berkasPerKlasifikasi.map(
                    (item: {
                        classification: string;
                        type: string;
                        total: string;
                        draft: string;
                        dalamProses: string;
                        diserahkanHukum: string;
                        diterimaHukum: string;
                    }) => ({
                        classification: item.classification,
                        type: item.type,
                        total: Number(item.total),
                        draft: Number(item.draft),
                        dalamProses: Number(item.dalamProses),
                        diserahkanHukum: Number(item.diserahkanHukum),
                        diterimaHukum: Number(item.diterimaHukum),
                    }),
                ),
                trendBulanan: trendFormatted,
            },
        };
    }

    /**
     * Get lawsuit detail list for statistic cards.
     * Parses comma-separated status/excludeStatuses params.
     */
    async getStatisticDetail(
        query: GetStatisticDetailDto,
        userId?: string,
        roles?: string[],
    ) {
        const {
            page = 1,
            limit = 100,
            month,
            year,
            viewAsRole,
            status,
            type,
            excludeStatuses,
            hasUpayaHukum,
        } = query;

        const resolvedYear = year ?? new Date().getFullYear();

        // Parse comma-separated status strings into arrays
        const statusArray: LawsuitStatus[] | undefined = status
            ? status.split(',').map((s) => s.trim() as LawsuitStatus)
            : undefined;

        const excludeStatusesArray: LawsuitStatus[] | undefined =
            excludeStatuses
                ? excludeStatuses
                      .split(',')
                      .map((s) => s.trim() as LawsuitStatus)
                : undefined;

        const typeValue: LawsuitType | undefined = type
            ? (type as LawsuitType)
            : undefined;

        const result = await this.dashboardRepository.getStatisticDetail(
            page,
            limit,
            month,
            resolvedYear,
            userId,
            roles,
            viewAsRole,
            statusArray,
            typeValue,
            excludeStatusesArray,
            hasUpayaHukum,
        );

        return {
            payload: result.data,
            meta: {
                total: result.total,
                page: result.page,
                limit: result.limit,
            },
        };
    }
}
