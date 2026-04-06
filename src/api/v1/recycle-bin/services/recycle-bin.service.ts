import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { LawsuitsRepository } from '../../lawsuits/repositories/lawsuits.repository';
import { UpayaHukumRepository } from '../../upaya-hukum/repositories/upaya-hukum.repository';
import { GetRecycleBinDto } from '../dtos/recycle-bin.dto';
import { handleServiceError } from '../../../../shared/utils/handler-service-error.util';

@Injectable()
export class RecycleBinService {
    private logger = new Logger(RecycleBinService.name);

    constructor(
        private readonly lawsuitsRepository: LawsuitsRepository,
        private readonly upayaHukumRepository: UpayaHukumRepository,
    ) {}

    async findAll(query: GetRecycleBinDto) {
        try {
            const items: any[] = [];

            // Fetch deleted lawsuits if type filter is not 'upaya-hukum'
            if (!query.type || query.type === 'lawsuit') {
                const [lawsuits] = await this.lawsuitsRepository.findDeletedItems({
                    page: query.page ?? 1,
                    limit: query.limit ?? 10,
                    search: query.search ?? '',
                    sortBy: query.sortBy ?? 'deletedAt',
                    sortType: query.sortType ?? 'DESC',
                });

                items.push(
                    ...lawsuits.map((l) => ({
                        id: l.id,
                        type: 'lawsuit' as const,
                        caseNumber: l.caseNumber,
                        classification: l.classification,
                        lawsuitType: l.type,
                        ppName: l.pp?.fullName ?? null,
                        deletedAt: l.deletedAt,
                    })),
                );
            }

            // Fetch deleted upaya-hukum if type filter is not 'lawsuit'
            if (!query.type || query.type === 'upaya-hukum') {
                const [upayaHukum] =
                    await this.upayaHukumRepository.findDeletedItems({
                        page: query.page ?? 1,
                        limit: query.limit ?? 10,
                        search: query.search ?? '',
                        sortBy: query.sortBy ?? 'deletedAt',
                        sortType: query.sortType ?? 'DESC',
                    });

                items.push(
                    ...upayaHukum.map((uh) => ({
                        id: uh.id,
                        type: 'upaya-hukum' as const,
                        caseNumber: uh.lawsuit?.caseNumber ?? null,
                        upayaHukumType: uh.type,
                        ppName: uh.lawsuit?.pp?.fullName ?? null,
                        deletedAt: uh.deletedAt,
                    })),
                );
            }

            // Sort combined items
            items.sort((a, b) => {
                const aTime = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
                const bTime = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
                return query.sortType === 'DESC' ? bTime - aTime : aTime - bTime;
            });

            // Apply pagination to combined results
            const page = query.page ?? 1;
            const limit = query.limit ?? 10;
            const total = items.length;
            const offset = (page - 1) * limit;
            const paginatedItems = items.slice(offset, offset + limit);
            const maxPages = Math.ceil(total / limit);

            return {
                payload: paginatedItems,
                metadata: {
                    page,
                    limit,
                    total,
                    maxPages,
                },
            };
        } catch (error) {
            this.logger.error(
                error instanceof Error ? error.stack || error.message : error,
            );
            handleServiceError(error);
        }
    }

    async restoreLawsuit(id: string) {
        try {
            const lawsuit = await this.lawsuitsRepository.findDeletedById(id);
            if (!lawsuit || !lawsuit.deletedAt) {
                throw new NotFoundException('Berkas tidak ditemukan di recycle bin');
            }

            await this.lawsuitsRepository.restore(id);

            return {
                payload: {
                    id,
                    caseNumber: lawsuit.caseNumber,
                    restoredAt: new Date(),
                },
            };
        } catch (error) {
            this.logger.error(
                error instanceof Error ? error.stack || error.message : error,
            );
            handleServiceError(error);
        }
    }

    async restoreUpayaHukum(id: string) {
        try {
            const upayaHukum = await this.upayaHukumRepository.findDeletedById(id);
            if (!upayaHukum || !upayaHukum.deletedAt) {
                throw new NotFoundException('Upaya Hukum tidak ditemukan di recycle bin');
            }

            await this.upayaHukumRepository.restore(id);

            return {
                payload: {
                    id,
                    caseNumber: upayaHukum.lawsuit?.caseNumber ?? null,
                    restoredAt: new Date(),
                },
            };
        } catch (error) {
            this.logger.error(
                error instanceof Error ? error.stack || error.message : error,
            );
            handleServiceError(error);
        }
    }

    async hardDeleteLawsuit(id: string) {
        try {
            const lawsuit = await this.lawsuitsRepository.findDeletedById(id);
            if (!lawsuit || !lawsuit.deletedAt) {
                throw new NotFoundException('Berkas tidak ditemukan di recycle bin');
            }

            await this.lawsuitsRepository.hardDelete(id);

            return {
                payload: {
                    id,
                    deleted: true,
                },
            };
        } catch (error) {
            this.logger.error(
                error instanceof Error ? error.stack || error.message : error,
            );
            handleServiceError(error);
        }
    }

    async hardDeleteUpayaHukum(id: string) {
        try {
            const upayaHukum = await this.upayaHukumRepository.findDeletedById(id);
            if (!upayaHukum || !upayaHukum.deletedAt) {
                throw new NotFoundException('Upaya Hukum tidak ditemukan di recycle bin');
            }

            await this.upayaHukumRepository.hardDelete(id);

            return {
                payload: {
                    id,
                    deleted: true,
                },
            };
        } catch (error) {
            this.logger.error(
                error instanceof Error ? error.stack || error.message : error,
            );
            handleServiceError(error);
        }
    }
}