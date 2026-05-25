import { Injectable, NotFoundException } from '@nestjs/common';
import { PublicRepository } from '../repositories/public.repository';
import { SearchLawsuitsDto, GetPublicDashboardDto } from '../dtos/public.dto';
import { LawsuitType } from '../../../../entities/lawsuit.entity';

@Injectable()
export class PublicService {
    constructor(private readonly publicRepository: PublicRepository) {}

    async searchLawsuits(query: SearchLawsuitsDto) {
        const { q, page, limit, type } = query;

        const [data, total] = await this.publicRepository.searchLawsuits(
            q,
            page,
            limit,
            type as unknown as LawsuitType,
        );

        return {
            payload: data,
            meta: {
                total,
                page,
                limit,
            },
        };
    }

    async getLawsuitDetail(id: string) {
        const lawsuit = await this.publicRepository.findLawsuitById(id);

        if (!lawsuit) {
            throw new NotFoundException('Berkas perkara tidak ditemukan');
        }

        return {
            payload: lawsuit,
        };
    }

    async getDashboardStatistics(query: GetPublicDashboardDto) {
        const { month, year } = query;
        const resolvedYear = year ?? new Date().getFullYear();

        const [
            summary,
            berkasPerKlasifikasi,
            trendBulanan,
            bhtHariIni,
        ] = await Promise.all([
            this.publicRepository.getSummary(month, resolvedYear),
            this.publicRepository.getBerkasPerKlasifikasi(
                month,
                resolvedYear,
            ),
            this.publicRepository.getTrendBulanan(resolvedYear),
            this.publicRepository.getBhtHariIni(),
        ]);

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

        const typeOrder = ['gugatan', 'permohonan'];
        const bhtLabels = ['Gugatan', 'Permohonan'];
        const bhtSeries = typeOrder.map((type) => {
            const found = bhtHariIni.chartData.find(
                (c: { type: string; count: string }) => c.type === type,
            );
            return found ? Number(found.count) : 0;
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
                bhtHariIni: {
                    chartData: {
                        labels: bhtLabels,
                        series: bhtSeries,
                    },
                    items: bhtHariIni.items,
                },
            },
        };
    }
}
