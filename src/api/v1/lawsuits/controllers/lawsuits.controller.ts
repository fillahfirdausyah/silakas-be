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
    UseGuards,
    StreamableFile,
    ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AuthGuard } from '../../auth/guards/auth.guard';
import { Roles } from '../../../../shared/decorators/roles.decorator';
import { LawsuitsService } from '../services/lawsuits.service';
import {
    BulkHandoverDto,
    CreateLawsuitDto,
    GenerateExcelDto,
    UpdateLawsuitDto,
    GetLawsuitsDto,
} from '../dtos/lawsuit.dto';
import { LawsuitType } from '../../../../entities/lawsuit.entity';

@ApiTags('Lawsuits')
@ApiBearerAuth('BearerAuth')
@UseGuards(AuthGuard)
@Controller({
    path: 'lawsuits',
    version: '1',
})
export class LawsuitsController {
    constructor(private readonly lawsuitsService: LawsuitsService) {}

    @Get('report')
    @Roles('panmud-hukum')
    async getReport() {
        const result = await this.lawsuitsService.generateExcelReport();
        return new StreamableFile(result.payload as any, {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            disposition: 'attachment; filename="laporan-gugatan.xlsx"',
        });
    }

    @Post('generate')
    @Roles('panitera-pengganti', 'panmud-gugatan', 'panmud-permohonan')
    async generate(@Body() body: GenerateExcelDto) {
        const result = await this.lawsuitsService.generateBeritaAcara(body);
        return new StreamableFile(result.payload as any, {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            disposition: 'attachment; filename="berita-acara-penyerahan.xlsx"',
        });
    }

    @Get()
    @Roles(
        'super-admin',
        'panitera-pengganti',
        'panmud-gugatan',
        'panmud-permohonan',
        'panmud-hukum',
    )
    async findAll(@Query() query: GetLawsuitsDto) {
        const result = await this.lawsuitsService.findAll(query);
        return {
            message: 'Berkas berhasil diambil',
            payload: result.payload,
            metadata: result.metadata,
        };
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const result = await this.lawsuitsService.findOne(id);
        return {
            message: 'Berkas berhasil diambil',
            payload: result.payload,
        };
    }

    @Post()
    @Roles('panitera-pengganti')
    async create(@Req() req: any, @Body() body: CreateLawsuitDto) {
        const result = await this.lawsuitsService.create(req.userId, body);
        return {
            message: 'Berkas berhasil dibuat',
            payload: result.payload,
        };
    }

    @Post('bulk-handover')
    @Roles('panitera-pengganti', 'panmud-gugatan', 'panmud-permohonan')
    async bulkHandover(@Req() req: any, @Body() body: BulkHandoverDto) {
        const result = await this.lawsuitsService.bulkHandover(
            body.lawsuitIds,
            req.roles,
        );
        return {
            message: 'Bulk serah terima berhasil',
            payload: result.payload,
        };
    }

    @Post('bulk-receive')
    @Roles('panmud-gugatan', 'panmud-permohonan', 'panmud-hukum')
    async bulkReceive(@Req() req: any, @Body() body: BulkHandoverDto) {
        const result = await this.lawsuitsService.bulkReceive(
            body.lawsuitIds,
            req.roles,
            req.userId,
        );
        return {
            message: 'Bulk penerimaan berhasil',
            payload: result.payload,
        };
    }

    @Post(':id/handover')
    @Roles('panitera-pengganti', 'panmud-gugatan', 'panmud-permohonan')
    async handover(@Req() req: any, @Param('id') id: string) {
        const roles = req.roles as string[];

        // Get lawsuit to determine type
        const lawsuitResult = await this.lawsuitsService.findOne(id);
        const lawsuit = lawsuitResult.payload;
        const isPermohonan = lawsuit.type === LawsuitType.PERMOHONAN;

        let result;
        // Status-based routing: determine action from document status, then validate role
        const status = lawsuit.status;

        if (status === 'DRAFT') {
            if (!roles.includes('panitera-pengganti')) {
                throw new ForbiddenException(
                    'Hanya Panitera Pengganti yang dapat menyerahkan berkas DRAFT',
                );
            }
            if (isPermohonan) {
                result = await this.lawsuitsService.handoverToPermohonan(id);
            } else {
                result = await this.lawsuitsService.handoverToGugatan(id);
            }
        } else if (status === 'RECEIVED_BY_GUGATAN' && !isPermohonan) {
            if (!roles.includes('panmud-gugatan')) {
                throw new ForbiddenException(
                    'Hanya Panmud Gugatan yang dapat menyerahkan berkas ini ke Hukum',
                );
            }
            result = await this.lawsuitsService.handoverToHukum(id);
        } else if (status === 'RECEIVED_BY_PERMOHONAN' && isPermohonan) {
            if (!roles.includes('panmud-permohonan')) {
                throw new ForbiddenException(
                    'Hanya Panmud Permohonan yang dapat menyerahkan berkas ini ke Hukum',
                );
            }
            result =
                await this.lawsuitsService.handoverFromPermohonanToHukum(id);
        } else {
            throw new ForbiddenException(
                'Status berkas tidak valid untuk penyerahan',
            );
        }

        return {
            message: 'Berkas berhasil diserahkan',
            payload: result.payload,
        };
    }

    @Post(':id/receive')
    @Roles('panmud-gugatan', 'panmud-permohonan', 'panmud-hukum')
    async receive(@Req() req: any, @Param('id') id: string) {
        const roles = req.roles as string[];

        // Get lawsuit to determine type
        const lawsuitResult = await this.lawsuitsService.findOne(id);
        const lawsuit = lawsuitResult.payload;
        const isPermohonan = lawsuit.type === LawsuitType.PERMOHONAN;

        let result;
        // Status-based routing: determine action from document status, then validate role
        const status = lawsuit.status;

        if (status === 'SUBMITTED_TO_GUGATAN' && !isPermohonan) {
            if (!roles.includes('panmud-gugatan')) {
                throw new ForbiddenException(
                    'Hanya Panmud Gugatan yang dapat menerima berkas ini',
                );
            }
            result = await this.lawsuitsService.receiveByGugatan(
                id,
                req.userId,
            );
        } else if (status === 'SUBMITTED_TO_PERMOHONAN' && isPermohonan) {
            if (!roles.includes('panmud-permohonan')) {
                throw new ForbiddenException(
                    'Hanya Panmud Permohonan yang dapat menerima berkas ini',
                );
            }
            result = await this.lawsuitsService.receiveByPermohonan(
                id,
                req.userId,
            );
        } else if (status === 'SUBMITTED_TO_HUKUM') {
            if (!roles.includes('panmud-hukum')) {
                throw new ForbiddenException(
                    'Hanya Panmud Hukum yang dapat menerima berkas ini',
                );
            }
            result = await this.lawsuitsService.receiveByHukum(id, req.userId);
        } else {
            throw new ForbiddenException(
                'Status berkas tidak valid untuk penerimaan',
            );
        }

        return {
            message: 'Berkas berhasil diterima',
            payload: result.payload,
        };
    }

    @Patch(':id')
    @Roles('panmud-gugatan', 'panmud-permohonan')
    async update(@Param('id') id: string, @Body() body: UpdateLawsuitDto) {
        const result = await this.lawsuitsService.updateDetails(id, body);
        return {
            message: 'Berkas berhasil diperbarui',
            payload: result.payload,
        };
    }

    @Delete(':id')
    @Roles('super-admin', 'panmud-gugatan', 'panmud-permohonan')
    async remove(@Req() req: any, @Param('id') id: string) {
        const roles = req.roles as string[];

        // Super-admin has universal access - no type check needed
        if (!roles.includes('super-admin')) {
            // Get lawsuit to determine type for role validation
            const lawsuitResult = await this.lawsuitsService.findOne(id);
            const lawsuit = lawsuitResult.payload;
            const isPermohonan = lawsuit.type === LawsuitType.PERMOHONAN;

            // Role-type validation: panmud-gugatan can only delete gugatan, panmud-permohonan can only delete permohonan
            if (roles.includes('panmud-gugatan') && isPermohonan) {
                throw new ForbiddenException(
                    'Panmud Gugatan hanya dapat menghapus berkas Gugatan',
                );
            }
            if (roles.includes('panmud-permohonan') && !isPermohonan) {
                throw new ForbiddenException(
                    'Panmud Permohonan hanya dapat menghapus berkas Permohonan',
                );
            }
        }

        const result = await this.lawsuitsService.softDelete(id);
        return {
            message: 'Berkas berhasil dihapus',
            payload: result.payload,
        };
    }
}
