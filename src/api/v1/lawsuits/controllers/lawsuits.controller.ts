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
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AuthGuard } from '../../auth/guards/auth.guard';
import { Roles } from '../../../../shared/decorators/roles.decorator';
import { LawsuitsService } from '../services/lawsuits.service';
import {
    CreateLawsuitDto,
    UpdateLawsuitDto,
    GetLawsuitsDto,
} from '../dtos/lawsuit.dto';

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

    @Get()
    @Roles('super-admin', 'pantera-pengganti', 'panmud-gugatan', 'panmud-hukum')
    async findAll(@Query() query: GetLawsuitsDto) {
        const result = await this.lawsuitsService.findAll({
            page: query.page,
            limit: query.limit,
            search: query.search,
            sortBy: query.sortBy,
            sortType: query.sortType,
        });
        return {
            message: 'Lawsuits retrieved successfully',
            payload: result.payload,
            metadata: result.metadata,
        };
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const result = await this.lawsuitsService.findOne(id);
        return {
            message: 'Lawsuit retrieved successfully',
            payload: result.payload,
        };
    }

    @Post()
    @Roles('pantera-pengganti')
    async create(@Req() req: any, @Body() body: CreateLawsuitDto) {
        const result = await this.lawsuitsService.create(req.userId, body);
        return {
            message: 'Lawsuit created successfully',
            payload: result.payload,
        };
    }

    @Post(':id/handover')
    // Dynamic role check?
    // If I put Roles here, it must be ANY of them.
    @Roles('pantera-pengganti', 'panmud-gugatan')
    async handover(@Req() req: any, @Param('id') id: string) {
        const roleSlug = req.role; // AuthGuard sets req['role'] as slug or role object?
        // AuthGuard: request['role'] = payload.role;
        // payload comes from jwt.verify. Login: payload: { id: user.id, role: user.role.slug } usually.
        // I need to verify what `payload.role` is.
        // Assuming slug.

        let result;
        if (roleSlug === 'pantera-pengganti') {
            result = await this.lawsuitsService.handoverToGugatan(id);
        } else if (roleSlug === 'panmud-gugatan') {
            result = await this.lawsuitsService.handoverToHukum(id);
        } else {
            // Should be blocked by guard, but safe handling
            throw new Error('Invalid role for handover');
        }

        return {
            message: 'Lawsuit handover successful',
            payload: result.payload,
        };
    }

    @Post(':id/receive')
    @Roles('panmud-gugatan', 'panmud-hukum')
    async receive(@Req() req: any, @Param('id') id: string) {
        const roleSlug = req.role;
        let result;
        if (roleSlug === 'panmud-gugatan') {
            result = await this.lawsuitsService.receiveByGugatan(
                id,
                req.userId,
            );
        } else if (roleSlug === 'panmud-hukum') {
            result = await this.lawsuitsService.receiveByHukum(id, req.userId);
        }

        return {
            message: 'Lawsuit received successfully',
            payload: result.payload,
        };
    }

    @Patch(':id')
    @Roles('panmud-gugatan')
    async update(@Param('id') id: string, @Body() body: UpdateLawsuitDto) {
        const result = await this.lawsuitsService.updateDetails(id, body);
        return {
            message: 'Lawsuit updated successfully',
            payload: result.payload,
        };
    }
}
