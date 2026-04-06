import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
    StreamableFile,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Roles } from '../../../../shared/decorators/roles.decorator';
import { AuthGuard } from '../../auth/guards/auth.guard';
import {
    BulkCreateUpayaHukumDto,
    BulkHandoverToHukumDto,
    BulkPromoteToKasasiDto,
    BulkReceiveByHukumDto,
    CreateUpayaHukumDto,
    GenerateBeritaAcaraDto,
    GetUpayaHukumDto,
    PromoteToKasasiDto,
    UpdateUpayaHukumDto,
} from '../dtos/upaya-hukum.dto';
import { UpayaHukumService } from '../services/upaya-hukum.service';

@ApiTags('Upaya Hukum')
@ApiBearerAuth('BearerAuth')
@UseGuards(AuthGuard)
@Controller({
    path: 'upaya-hukum',
    version: '1',
})
export class UpayaHukumController {
    constructor(private readonly upayaHukumService: UpayaHukumService) {}

    @Get()
    @Roles('panmud-gugatan', 'panmud-hukum')
    async findAll(@Query() query: GetUpayaHukumDto) {
        const result = await this.upayaHukumService.findAll(query);
        return {
            message: 'Data Upaya Hukum berhasil diambil',
            payload: result.payload,
        };
    }

    @Post()
    @Roles('panmud-gugatan')
    async create(@Body() body: CreateUpayaHukumDto) {
        const result = await this.upayaHukumService.create(body);
        return {
            message: 'Berkas berhasil dimasukkan ke Upaya Hukum',
            payload: result.payload,
        };
    }

    @Post('bulk')
    @Roles('panmud-gugatan', 'panmud-permohonan')
    async bulkCreate(@Body() body: BulkCreateUpayaHukumDto) {
        const result = await this.upayaHukumService.bulkCreate(body);
        return {
            message: 'Bulk masukan ke Upaya Hukum berhasil',
            payload: result.payload,
            errors: result.errors,
        };
    }

    @Post('bulk-promote-to-kasasi')
    @Roles('panmud-gugatan', 'panmud-permohonan')
    async bulkPromoteToKasasi(@Body() body: BulkPromoteToKasasiDto) {
        const result = await this.upayaHukumService.bulkPromoteToKasasi(body);
        return {
            message: 'Bulk promosi ke Kasasi berhasil',
            payload: result.payload,
            errors: result.errors,
        };
    }

    @Post('generate')
    @Roles('panmud-gugatan')
    async generate(@Body() body: GenerateBeritaAcaraDto) {
        const result = await this.upayaHukumService.generateBeritaAcara(body);
        return new StreamableFile(result.payload as any, {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            disposition: 'attachment; filename="berita-acara-upaya-hukum.xlsx"',
        });
    }

    @Patch(':id')
    @Roles('panmud-gugatan')
    async update(@Param('id') id: string, @Body() body: UpdateUpayaHukumDto) {
        const result = await this.upayaHukumService.update(id, body);
        return {
            message: 'Tanggal daftar berhasil diperbarui',
            payload: result.payload,
        };
    }

    @Post(':id/promote-to-kasasi')
    @Roles('panmud-gugatan')
    async promoteToKasasi(
        @Param('id') id: string,
        @Body() body: PromoteToKasasiDto,
    ) {
        const result = await this.upayaHukumService.promoteToKasasi(id, body);
        return {
            message: 'Berkas berhasil dipindahkan ke Kasasi',
            payload: result.payload,
        };
    }

    // ==================== HANDOVER TO HUKUM FROM UPAYA HUKUM ====================

    @Post('bulk-handover-to-hukum')
    @Roles('panmud-gugatan', 'panmud-permohonan')
    async bulkHandoverToHukum(@Body() body: BulkHandoverToHukumDto) {
        const result = await this.upayaHukumService.bulkHandoverToHukum(body);
        return {
            message: 'Bulk serah terima ke Panmud Hukum berhasil',
            payload: result.payload,
            errors: result.errors,
        };
    }

    @Post('bulk-receive-by-hukum')
    @Roles('panmud-hukum')
    async bulkReceiveByHukum(
        @Req() req: any,
        @Body() body: BulkReceiveByHukumDto,
    ) {
        const result = await this.upayaHukumService.bulkReceiveByHukum(
            body,
            req.userId,
        );
        return {
            message: 'Bulk penerimaan oleh Panmud Hukum berhasil',
            payload: result.payload,
            errors: result.errors,
        };
    }

    @Delete(':id')
    @Roles('super-admin')
    async remove(@Param('id') id: string) {
        const result = await this.upayaHukumService.softDelete(id);
        return {
            message: 'Upaya Hukum berhasil dihapus',
            payload: result.payload,
        };
    }
}
