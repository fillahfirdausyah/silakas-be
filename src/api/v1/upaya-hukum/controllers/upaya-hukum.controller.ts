import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Roles } from '../../../../shared/decorators/roles.decorator';
import { AuthGuard } from '../../auth/guards/auth.guard';
import {
    CreateUpayaHukumDto,
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
}
