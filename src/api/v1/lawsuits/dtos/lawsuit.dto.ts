import { Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsArray,
    IsDateString,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    Matches,
    Min,
} from 'class-validator';
import { LawsuitStatus } from '../../../../entities/lawsuit.entity';

export enum LawsuitType {
    GUGATAN = 'gugatan',
    PERMOHONAN = 'permohonan',
}

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

    @IsUUID('4', { message: 'PP id must be UUID' })
    @IsOptional()
    ppId?: string;

    @IsUUID('4', { message: 'JS id must be UUID' })
    @IsOptional()
    jsId?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsDateString()
    @IsOptional()
    ikrarDate?: string;

    @IsDateString()
    @IsOptional()
    pbtDate?: string;

    @IsDateString()
    @IsOptional()
    bhtDate?: string;

    @IsEnum(LawsuitType, {
        message: 'Type must be either gugatan or permohonan',
    })
    @IsOptional()
    type?: LawsuitType;
}

export class UpdateLawsuitDto {
    @IsString()
    @IsOptional()
    @Matches(/^\d+\/Pdt\.G\/\d{4}\/PA\.Bjm$/, {
        message: 'Case number must follow the format xxx/Pdt.G/yyyy/PA.Bjm',
    })
    caseNumber?: string;

    @IsDateString()
    @IsOptional()
    decisionDate?: string;

    @IsUUID('4', { message: 'Document classification id must be UUID' })
    @IsOptional()
    documentClassificationId?: string;

    @IsDateString()
    @IsOptional()
    pbtDate?: string;

    @IsDateString()
    @IsOptional()
    bhtDate?: string;

    @IsDateString()
    @IsOptional()
    ikrarDate?: string;

    @IsUUID('4', { message: 'PP id must be UUID' })
    @IsOptional()
    ppId?: string;

    @IsUUID('4', { message: 'JS id must be UUID' })
    @IsOptional()
    jsId?: string;

    @IsString()
    @IsOptional()
    description?: string;
}

export class GenerateExcelDto {
    @IsArray()
    @IsUUID('4', { each: true })
    @ArrayMinSize(1)
    lawsuitIds: string[];

    @IsEnum(LawsuitType, {
        message: 'Type must be either gugatan or permohonan',
    })
    @IsOptional()
    type?: LawsuitType;
}

export class BulkHandoverDto {
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

    @IsEnum(LawsuitType, {
        message: 'Type must be either gugatan or permohonan',
    })
    @IsOptional()
    type?: LawsuitType;

    @IsEnum(LawsuitStatus, {
        message: 'Status must be a valid lawsuit status',
    })
    @IsOptional()
    status?: LawsuitStatus;

    @IsDateString()
    @IsOptional()
    startDate?: string;

    @IsDateString()
    @IsOptional()
    endDate?: string;
}
