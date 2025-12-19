import {
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class GetUsersDto {
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Transform(({ value }) => parseInt(value))
    page: number = 1;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(100)
    @Transform(({ value }) => parseInt(value))
    limit: number = 10;

    @IsOptional()
    @IsString()
    search: string = '';

    @IsOptional()
    @IsString()
    sortBy: string = 'createdAt';

    @IsOptional()
    @IsString()
    @IsEnum(['ASC', 'DESC'], {
        message: "value must be one of the following values: ['ASC', 'DESC']",
    })
    @Transform(({ value }) => value.toUpperCase())
    sortType: string = 'ASC';
}
