import { Injectable } from '@nestjs/common';
import { DashboardRepository } from '../repositories/dashboard.repository';
import { GetDashboardDto } from '../dtos/dashboard.dto';

@Injectable()
export class DashboardService {
    constructor(private readonly dashboardRepository: DashboardRepository) {}

    async getStatistics(
        query: GetDashboardDto,
        userId?: string,
        roleSlug?: string,
    ) {
        const { month, year } = query;
        const resolvedYear = year ?? new Date().getFullYear();

        const [summary, berkasPerKlasifikasi, trendBulanan] = await Promise.all(
            [
                this.dashboardRepository.getSummary(
                    month,
                    resolvedYear,
                    userId,
                    roleSlug,
                ),
                this.dashboardRepository.getBerkasPerKlasifikasi(
                    month,
                    resolvedYear,
                    userId,
                    roleSlug,
                ),
                this.dashboardRepository.getTrendBulanan(
                    resolvedYear,
                    userId,
                    roleSlug,
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
}
