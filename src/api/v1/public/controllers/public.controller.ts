import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { PublicService } from '../services/public.service';
import { SearchLawsuitsDto, GetPublicDashboardDto } from '../dtos/public.dto';

@ApiTags('Public')
@Controller({
    path: 'public',
    version: '1',
})
export class PublicController {
    constructor(private readonly publicService: PublicService) {}

    @Get('lawsuits/search')
    @ApiOperation({ summary: 'Search lawsuits by case number (public)' })
    async searchLawsuits(@Query() query: SearchLawsuitsDto) {
        const result = await this.publicService.searchLawsuits(query);
        return {
            message: 'Data berhasil diambil',
            payload: result.payload,
            meta: result.meta,
        };
    }

    @Get('lawsuits/:id')
    @ApiOperation({ summary: 'Get lawsuit detail (public)' })
    async getLawsuitDetail(@Param('id', ParseUUIDPipe) id: string) {
        const result = await this.publicService.getLawsuitDetail(id);
        return {
            message: 'Data berhasil diambil',
            payload: result.payload,
        };
    }

    @Get('dashboard/statistics')
    @ApiOperation({ summary: 'Get public dashboard statistics' })
    async getDashboardStatistics(@Query() query: GetPublicDashboardDto) {
        const result = await this.publicService.getDashboardStatistics(query);
        return {
            message: 'Statistik berhasil diambil',
            payload: result.payload,
        };
    }
}
