import {
    ConflictException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';

import { DocumentClassificationEntity } from '../../../../entities/document-classification.entity';
import { handleServiceError } from '../../../../shared/utils/handler-service-error.util';
import { DocumentClassificationsRepository } from '../repositories/document-classifications.repository';
import { CreateDocumentClassificationDto } from '../dtos/create-document-classification.dto';
import { UpdateDocumentClassificationDto } from '../dtos/update-document-classification.dto';

@Injectable()
export class DocumentClassificationsService {
    private logger = new Logger(DocumentClassificationsService.name);

    constructor(
        private readonly repository: DocumentClassificationsRepository,
    ) {}

    public async findAll(metadata: {
        page: number;
        limit: number;
        search: string;
        sortBy: string;
        sortType: string;
    }) {
        try {
            const [items, count] =
                await this.repository.findByPagination(metadata);

            const maxPages = count > 0 ? Math.ceil(count / metadata.limit) : 1;

            return {
                payload: items.map((item) => this.serialize(item)),
                metadata: {
                    page: metadata.page,
                    limit: metadata.limit,
                    search: metadata.search,
                    sortBy: metadata.sortBy,
                    sortType: metadata.sortType,
                    maxPages,
                    total: count,
                },
            };
        } catch (error) {
            this.logger.error(error.stack || error);
            handleServiceError(error);
        }
    }

    public async findOne(id: string) {
        try {
            const item = await this.repository.findById(id);
            if (!item) {
                throw new NotFoundException(
                    'Klasifikasi dokumen tidak ditemukan',
                );
            }

            return {
                payload: this.serialize(item),
            };
        } catch (error) {
            this.logger.error(error.stack || error);
            handleServiceError(error);
        }
    }

    public async create(payload: CreateDocumentClassificationDto) {
        try {
            const [existingName, existingCode] = await Promise.all([
                this.repository.findByName(payload.name),
                this.repository.findByCode(payload.code),
            ]);

            if (existingName) {
                throw new ConflictException('Nama sudah digunakan');
            }

            if (existingCode) {
                throw new ConflictException('Kode sudah digunakan');
            }

            const created = await this.repository.create({
                name: payload.name,
                code: payload.code,
                description: payload.description,
            });

            return {
                payload: this.serialize(created),
            };
        } catch (error) {
            this.logger.error(error.stack || error);
            handleServiceError(error);
        }
    }

    public async update(payload: UpdateDocumentClassificationDto) {
        try {
            const item = await this.repository.findById(payload.id);
            if (!item) {
                throw new NotFoundException(
                    'Klasifikasi dokumen tidak ditemukan',
                );
            }

            if (payload.name && payload.name !== item.name) {
                const existingName = await this.repository.findByName(
                    payload.name,
                );
                if (existingName && existingName.id !== item.id) {
                    throw new ConflictException('Nama sudah digunakan');
                }
                item.name = payload.name;
            }

            if (payload.code && payload.code !== item.code) {
                const existingCode = await this.repository.findByCode(
                    payload.code,
                );
                if (existingCode && existingCode.id !== item.id) {
                    throw new ConflictException('Kode sudah digunakan');
                }
                item.code = payload.code;
            }

            if (payload.description !== undefined) {
                item.description = payload.description;
            }

            if (payload.isActive !== undefined) {
                item.isActive = payload.isActive;
            }

            const updated = await this.repository.save(item);

            return {
                payload: this.serialize(updated),
            };
        } catch (error) {
            this.logger.error(error.stack || error);
            handleServiceError(error);
        }
    }

    public async delete(id: string) {
        try {
            const item = await this.repository.findById(id);
            if (!item) {
                throw new NotFoundException(
                    'Klasifikasi dokumen tidak ditemukan',
                );
            }

            await this.repository.softDelete(id);

            return {
                payload: null,
            };
        } catch (error) {
            this.logger.error(error.stack || error);
            handleServiceError(error);
        }
    }

    private serialize(item: DocumentClassificationEntity) {
        return {
            id: item.id,
            name: item.name,
            code: item.code,
            description: item.description,
            isActive: item.isActive,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        };
    }
}