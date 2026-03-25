import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AuthGuard } from '../../auth/guards/auth.guard';
import { Roles } from '../../../../shared/decorators/roles.decorator';
import { DocumentClassificationsService } from '../services/document-classifications.service';
import { CreateDocumentClassificationDto } from '../dtos/create-document-classification.dto';
import { UpdateDocumentClassificationDto } from '../dtos/update-document-classification.dto';
import { GetDocumentClassificationsDto } from '../dtos/get-document-classifications.dto';

@ApiTags('Document Classifications')
@ApiBearerAuth('BearerAuth')
@UseGuards(AuthGuard)
@Controller({
    path: 'document-classifications',
    version: '1',
})
export class DocumentClassificationsController {
    constructor(private readonly service: DocumentClassificationsService) {}

    @Get()
    async getAll(@Query() query: GetDocumentClassificationsDto) {
        const result = await this.service.findAll({
            page: query.page,
            limit: query.limit,
            search: query.search,
            sortBy: query.sortBy,
            sortType: query.sortType,
            type: query.type,
        });

        return {
            message: 'Klasifikasi dokumen berhasil diambil',
            payload: result.payload,
            metadata: result.metadata,
        };
    }

    @Get(':id')
    async getOne(@Param('id') id: string) {
        const result = await this.service.findOne(id);

        return {
            message: 'Klasifikasi dokumen berhasil diambil',
            payload: result.payload,
        };
    }

    @Post()
    @Roles('super-admin')
    async create(@Body() body: CreateDocumentClassificationDto) {
        const result = await this.service.create(body);

        return {
            message: 'Klasifikasi dokumen berhasil dibuat',
            payload: result.payload,
        };
    }

    @Put()
    @Roles('super-admin')
    async update(@Body() body: UpdateDocumentClassificationDto) {
        const result = await this.service.update(body);

        return {
            message: 'Klasifikasi dokumen berhasil diperbarui',
            payload: result.payload,
        };
    }

    @Delete(':id')
    @Roles('super-admin')
    async delete(@Param('id') id: string) {
        await this.service.delete(id);

        return {
            message: 'Klasifikasi dokumen berhasil dihapus',
            payload: null,
        };
    }
}
