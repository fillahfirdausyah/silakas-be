import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';

import { DocumentClassificationEntity } from '../../../../entities/document-classification.entity';

@Injectable()
export class DocumentClassificationsRepository {
    constructor(
        @InjectRepository(DocumentClassificationEntity)
        private readonly repository: Repository<DocumentClassificationEntity>,
    ) {}

    findByPagination(metadata: {
        page: number;
        limit: number;
        search: string;
        sortBy: string;
        sortType: string;
    }) {
        const offset =
            metadata.page > 1 ? metadata.limit * (metadata.page - 1) : 0;
        const baseWhere: FindOptionsWhere<DocumentClassificationEntity> = {};
        let where: FindOptionsWhere<DocumentClassificationEntity>[] = [];

        if (metadata.search) {
            const searchConditions: FindOptionsWhere<DocumentClassificationEntity>[] =
                [
                    { ...baseWhere, name: ILike(`%${metadata.search}%`) },
                    { ...baseWhere, code: ILike(`%${metadata.search}%`) },
                ];
            where = searchConditions;
        } else {
            where = [baseWhere];
        }

        const queryOptions = {
            skip: offset,
            take: metadata.limit,
            where,
            order: {
                [metadata.sortBy || 'createdAt']: metadata.sortType,
            },
        };

        return this.repository.findAndCount(queryOptions);
    }

    findById(id: string) {
        return this.repository.findOne({
            where: { id },
        });
    }

    findByName(name: string) {
        return this.repository.findOne({
            where: { name },
        });
    }

    findByCode(code: string) {
        return this.repository.findOne({
            where: { code },
        });
    }

    create(data: Partial<DocumentClassificationEntity>) {
        const entity = this.repository.create(data);
        return this.repository.save(entity);
    }

    save(entity: DocumentClassificationEntity) {
        return this.repository.save(entity);
    }

    softDelete(id: string) {
        return this.repository.softDelete(id);
    }
}