import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, In, Repository } from 'typeorm';
import {
    LawsuitEntity,
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

        // Apply type filter if provided
        if (metadata.type) {
            if (Array.isArray(where)) {
                where = where.map((w) => ({ ...w, type: metadata.type }));
            } else {
                where = { ...where, type: metadata.type };
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
