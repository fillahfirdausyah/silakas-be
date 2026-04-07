import {
    Controller,
    ForbiddenException,
    Get,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthGuard } from '../../auth/guards/auth.guard';
import { DashboardService } from '../services/dashboard.service';
import { GetDashboardDto } from '../dtos/dashboard.dto';
import { GetStatisticDetailDto } from '../dtos/get-statistic-detail.dto';

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
    @ApiOperation({ summary: 'Get dashboard statistics summary' })
    async getStatistics(@Query() query: GetDashboardDto, @Req() req: any) {
        // Extract user context for role-based data filtering
        const userId = req.userId;
        const roles = req.roles;

        // Security validation: viewAsRole must be one of user's actual roles
        if (query.viewAsRole && !roles?.includes(query.viewAsRole)) {
            throw new ForbiddenException(
                'Tidak dapat memilih role yang tidak Anda miliki.',
            );
        }

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

    @Get('statistic-detail')
    @ApiOperation({
        summary: 'Get lawsuit detail list for statistic cards',
        description:
            'Returns lawsuit list with same filtering logic as dashboard statistics. Use this for statistic card detail dialogs to ensure data consistency.',
    })
    async getStatisticDetail(
        @Query() query: GetStatisticDetailDto,
        @Req() req: any,
    ) {
        const userId = req.userId;
        const roles = req.roles;

        // Security validation: viewAsRole must be one of user's actual roles
        if (query.viewAsRole && !roles?.includes(query.viewAsRole)) {
            throw new ForbiddenException(
                'Tidak dapat memilih role yang tidak Anda miliki.',
            );
        }

        const result = await this.dashboardService.getStatisticDetail(
            query,
            userId,
            roles,
        );

        return {
            message: 'Data berhasil diambil',
            payload: result.payload,
            meta: result.meta,
        };
    }
}
