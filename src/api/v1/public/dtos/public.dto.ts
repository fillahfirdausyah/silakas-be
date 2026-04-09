import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export enum PublicLawsuitType {
    GUGATAN = 'gugatan',
    PERMOHONAN = 'permohonan',
}

export class SearchLawsuitsDto {
    @IsOptional()
    @IsString()
    q: string = '';

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit: number = 10;

    @IsEnum(PublicLawsuitType, {
        message: 'Type must be either gugatan or permohonan',
    })
    @IsOptional()
    type?: PublicLawsuitType;
}

export class GetPublicDashboardDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    month?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(2000)
    year?: number;
}
