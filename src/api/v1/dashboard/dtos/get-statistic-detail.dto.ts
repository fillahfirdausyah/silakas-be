import { Transform, Type } from 'class-transformer';
import {
    IsBoolean,
    IsInt,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';

/**
 * DTO for getting statistic detail list.
 * Used by dashboard cards to show detailed lawsuit lists.
 * Uses same filtering logic as dashboard statistics for consistency.
 */
export class GetStatisticDetailDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 100;

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
     */
    @IsOptional()
    @IsString()
    viewAsRole?: string;

    /**
     * Filter by lawsuit status (single or comma-separated multiple).
     */
    @IsOptional()
    @IsString()
    status?: string;

    /**
     * Filter by lawsuit type.
     */
    @IsOptional()
    @IsString()
    type?: string;

    /**
     * Exclude lawsuits with these statuses (comma-separated).
     */
    @IsOptional()
    @IsString()
    excludeStatuses?: string;

    /**
     * Filter lawsuits that have active upaya hukum.
     */
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    hasUpayaHukum?: boolean;
}