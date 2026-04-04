import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    Between,
    FindOptionsWhere,
    ILike,
    In,
    LessThanOrEqual,
    MoreThanOrEqual,
    Repository,
} from 'typeorm';
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

        let where:
            | FindOptionsWhere<LawsuitEntity>[]
            | FindOptionsWhere<LawsuitEntity> = {};

        if (metadata.search) {
            where = [
                { caseNumber: ILike(`%${metadata.search}%`) },
                { classification: ILike(`%${metadata.search}%`) },
            ];
        }

        // Apply type filter
        if (metadata.type) {
            if (Array.isArray(where)) {
                where = where.map((w) => ({ ...w, type: metadata.type }));
            } else {
                where = { ...where, type: metadata.type };
            }
        }

        // Apply status filter
        if (metadata.status) {
            if (Array.isArray(where)) {
                where = where.map((w) => ({ ...w, status: metadata.status }));
            } else {
                where = { ...where, status: metadata.status };
            }
        }

        // Apply ppId filter
        if (metadata.ppId) {
            if (Array.isArray(where)) {
                where = where.map((w) => ({
                    ...w,
                    pp: { id: metadata.ppId },
                }));
            } else {
                where = { ...where, pp: { id: metadata.ppId } };
            }
        }

        // Apply decision date range filter
        const dateFilter = this.buildDateFilter(
            metadata.startDate,
            metadata.endDate,
        );
        if (dateFilter) {
            if (Array.isArray(where)) {
                where = where.map((w) => ({
                    ...w,
                    decisionDate: dateFilter,
                }));
            } else {
                where = { ...where, decisionDate: dateFilter };
            }
        }

        // Apply BHT date range filter
        const bhtDateFilter = this.buildDateFilter(
            metadata.bhtStartDate,
            metadata.bhtEndDate,
        );
        if (bhtDateFilter) {
            if (Array.isArray(where)) {
                where = where.map((w) => ({
                    ...w,
                    bhtDate: bhtDateFilter,
                }));
            } else {
                where = { ...where, bhtDate: bhtDateFilter };
            }
        }

        const queryOptions = {
            skip: offset,
            take: metadata.limit,
            where,
            order: {
                [metadata.sortBy]: metadata.sortType.toUpperCase() as
                    | 'ASC'
                    | 'DESC',
            },
            relations: [
                'pp',
                'js',
                'panmudGugatan',
                'panmudPermohonan',
                'panmudHukum',
                'documentClassification',
                'upayaHukum',
            ],
        };

        return this.lawsuitsRepository.findAndCount(queryOptions);
    }

    private buildDateFilter(startDate?: string, endDate?: string) {
        if (startDate && endDate) {
            return Between(new Date(startDate), new Date(endDate));
        }
        if (startDate) {
            return MoreThanOrEqual(new Date(startDate));
        }
        if (endDate) {
            return LessThanOrEqual(new Date(endDate));
        }
        return null;
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
}
