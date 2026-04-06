import {
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AuthGuard } from '../../auth/guards/auth.guard';
import { Roles } from '../../../../shared/decorators/roles.decorator';
import { RecycleBinService } from '../services/recycle-bin.service';
import { GetRecycleBinDto } from '../dtos/recycle-bin.dto';

@ApiTags('Recycle Bin')
@ApiBearerAuth('BearerAuth')
@UseGuards(AuthGuard)
@Controller({
    path: 'recycle-bin',
    version: '1',
})
export class RecycleBinController {
    constructor(private readonly recycleBinService: RecycleBinService) {}

    @Get()
    @Roles('super-admin')
    async findAll(@Query() query: GetRecycleBinDto) {
        const result = await this.recycleBinService.findAll(query);
        return {
            message: 'Data recycle bin berhasil diambil',
            payload: result.payload,
            metadata: result.metadata,
        };
    }

    @Patch('lawsuits/:id/restore')
    @Roles('super-admin')
    async restoreLawsuit(@Param('id') id: string) {
        const result = await this.recycleBinService.restoreLawsuit(id);
        return {
            message: 'Berkas berhasil dipulihkan',
            payload: result.payload,
        };
    }

    @Patch('upaya-hukum/:id/restore')
    @Roles('super-admin')
    async restoreUpayaHukum(@Param('id') id: string) {
        const result = await this.recycleBinService.restoreUpayaHukum(id);
        return {
            message: 'Upaya Hukum berhasil dipulihkan',
            payload: result.payload,
        };
    }

    @Delete('lawsuits/:id')
    @Roles('super-admin')
    async hardDeleteLawsuit(@Param('id') id: string) {
        const result = await this.recycleBinService.hardDeleteLawsuit(id);
        return {
            message: 'Berkas berhasil dihapus permanen',
            payload: result.payload,
        };
    }

    @Delete('upaya-hukum/:id')
    @Roles('super-admin')
    async hardDeleteUpayaHukum(@Param('id') id: string) {
        const result = await this.recycleBinService.hardDeleteUpayaHukum(id);
        return {
            message: 'Upaya Hukum berhasil dihapus permanen',
            payload: result.payload,
        };
    }
}