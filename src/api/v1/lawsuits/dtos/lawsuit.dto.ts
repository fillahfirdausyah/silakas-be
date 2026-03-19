import {
    ArrayMinSize,
    IsArray,
    IsDateString,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    Matches,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLawsuitDto {
    @IsString()
    @IsNotEmpty()
    @Matches(/^\d+\/Pdt\.G\/\d{4}\/PA\.Bjm$/, {
        message: 'Case number must follow the format xxx/Pdt.G/yyyy/PA.Bjm',
    })
    caseNumber: string;

    @IsDateString()
    @IsNotEmpty()
    decisionDate: string; // Incoming as string from JSON

    @IsUUID('4', { message: 'Document classification id must be UUID' })
    @IsNotEmpty({ message: 'Document classification is required' })
    documentClassificationId: string;
}

export class UpdateLawsuitDto {
    @IsDateString()
    @IsOptional()
    pbtDate?: string;

    @IsDateString()
    @IsOptional()
    bhtDate?: string;

    @IsDateString()
    @IsOptional()
    ikrarDate?: string;
}

export class GenerateExcelDto {
    @IsArray()
    @IsUUID('4', { each: true })
    @ArrayMinSize(1)
    lawsuitIds: string[];
}

export class GetLawsuitsDto {
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

    @IsOptional()
    @IsString()
    search: string = '';

    @IsOptional()
    @IsString()
    sortBy: string = 'created_at';

    @IsOptional()
    @IsString()
    sortType: string = 'DESC';
}
