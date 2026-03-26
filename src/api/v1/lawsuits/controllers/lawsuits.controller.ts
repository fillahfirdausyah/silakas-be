import {
    Body,
    Controller,
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
    @Roles('panmud-gugatan', 'panmud-permohonan')
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
            req.role,
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
            req.role,
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
        const roleSlug = req.role;

        // Get lawsuit to determine type
        const lawsuitResult = await this.lawsuitsService.findOne(id);
        const lawsuit = lawsuitResult.payload;
        const isPermohonan = lawsuit.type === LawsuitType.PERMOHONAN;

        let result;
        if (roleSlug === 'panitera-pengganti') {
            // PP submits to either Gugatan or Permohonan based on type
            if (isPermohonan) {
                result = await this.lawsuitsService.handoverToPermohonan(id);
            } else {
                result = await this.lawsuitsService.handoverToGugatan(id);
            }
        } else if (roleSlug === 'panmud-gugatan' && !isPermohonan) {
            // Panmud Gugatan submits to Hukum (only for Gugatan type)
            result = await this.lawsuitsService.handoverToHukum(id);
        } else if (roleSlug === 'panmud-permohonan' && isPermohonan) {
            // Panmud Permohonan submits to Hukum (only for Permohonan type)
            result =
                await this.lawsuitsService.handoverFromPermohonanToHukum(id);
        } else {
            throw new ForbiddenException('Role tidak valid untuk penyerahan');
        }

        return {
            message: 'Berkas berhasil diserahkan',
            payload: result.payload,
        };
    }

    @Post(':id/receive')
    @Roles('panmud-gugatan', 'panmud-permohonan', 'panmud-hukum')
    async receive(@Req() req: any, @Param('id') id: string) {
        const roleSlug = req.role;

        // Get lawsuit to determine type
        const lawsuitResult = await this.lawsuitsService.findOne(id);
        const lawsuit = lawsuitResult.payload;
        const isPermohonan = lawsuit.type === LawsuitType.PERMOHONAN;

        let result;
        if (roleSlug === 'panmud-gugatan' && !isPermohonan) {
            result = await this.lawsuitsService.receiveByGugatan(
                id,
                req.userId,
            );
        } else if (roleSlug === 'panmud-permohonan' && isPermohonan) {
            result = await this.lawsuitsService.receiveByPermohonan(
                id,
                req.userId,
            );
        } else if (roleSlug === 'panmud-hukum') {
            result = await this.lawsuitsService.receiveByHukum(id, req.userId);
        } else {
            throw new ForbiddenException(
                'Role tidak valid untuk menerima berkas ini',
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
}
