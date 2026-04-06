import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AuthGuard } from '../../auth/guards/auth.guard';
import { DashboardService } from '../services/dashboard.service';
import { GetDashboardDto } from '../dtos/dashboard.dto';

@ApiTags('Dashboard')
@ApiBearerAuth('BearerAuth')
@UseGuards(AuthGuard)
@Controller({
    path: 'dashboard',
    version: '1',
})
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) {}

    @Get('statistics')
    async getStatistics(@Query() query: GetDashboardDto, @Req() req: any) {
        // Extract user context for role-based data filtering
        const userId = req.userId;
        const roles = req.roles;

        const result = await this.dashboardService.getStatistics(
            query,
            userId,
            roles,
        );
        return {
            message: 'Statistik berhasil diambil',
            payload: result.payload,
        };
    }
}
