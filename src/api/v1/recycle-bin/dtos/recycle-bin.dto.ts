import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetRecycleBinDto {
    @ApiPropertyOptional({ default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    search?: string = '';

    @ApiPropertyOptional({ default: 'deletedAt' })
    @IsOptional()
    @IsString()
    sortBy?: string = 'deletedAt';

    @ApiPropertyOptional({ default: 'DESC', enum: ['ASC', 'DESC'] })
    @IsOptional()
    @IsString()
    sortType?: 'ASC' | 'DESC' = 'DESC';

    @ApiPropertyOptional({ description: 'Filter by item type' })
    @IsOptional()
    @IsString()
    type?: 'lawsuit' | 'upaya-hukum';
}
