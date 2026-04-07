import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GetDashboardDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(12)
    month?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(2000)
    year?: number;

    /**
     * Role to view dashboard data as.
     * Used when user has multiple roles including panitera-pengganti.
     * When 'panitera-pengganti' is selected, data is filtered to show only
     * lawsuits assigned to that user (pp_id = userId).
     */
    @IsOptional()
    @IsString()
    viewAsRole?: string;
}
