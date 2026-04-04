import { Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsArray,
    IsDateString,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    ValidateNested,
} from 'class-validator';
import { UpayaHukumType } from '../../../../entities/upaya-hukum.entity';

export class CreateUpayaHukumDto {
    @IsUUID('4', { message: 'Lawsuit id must be UUID' })
    @IsNotEmpty({ message: 'Lawsuit id is required' })
    lawsuitId: string;

    @IsDateString({}, { message: 'Tanggal daftar must be a valid date' })
    @IsNotEmpty({ message: 'Tanggal daftar is required' })
    tanggalDaftar: string;
}

export class PromoteToKasasiDto {
    @IsDateString({}, { message: 'Tanggal daftar kasasi must be a valid date' })
    @IsNotEmpty({ message: 'Tanggal daftar kasasi is required' })
    tanggalDaftarKasasi: string;
}

export class UpdateUpayaHukumDto {
    @IsDateString({}, { message: 'Tanggal daftar must be a valid date' })
    @IsNotEmpty({ message: 'Tanggal daftar is required' })
    tanggalDaftar: string;
}

export class GetUpayaHukumDto {
    @IsEnum(UpayaHukumType, {
        message: 'Type must be either BANDING or KASASI',
    })
    @IsOptional()
    type?: UpayaHukumType;
}

export class BulkUpayaHukumItemDto {
    @IsUUID('4', { message: 'Lawsuit id must be UUID' })
    @IsNotEmpty({ message: 'Lawsuit id is required' })
    lawsuitId: string;

    @IsDateString({}, { message: 'Tanggal daftar must be a valid date' })
    @IsNotEmpty({ message: 'Tanggal daftar is required' })
    tanggalDaftar: string;
}

export class BulkCreateUpayaHukumDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BulkUpayaHukumItemDto)
    @ArrayMinSize(1)
    items: BulkUpayaHukumItemDto[];
}

export class BulkPromoteToKasasiItemDto {
    @IsUUID('4', { message: 'Upaya hukum id must be UUID' })
    @IsNotEmpty({ message: 'Upaya hukum id is required' })
    upayaHukumId: string;

    @IsDateString({}, { message: 'Tanggal daftar kasasi must be a valid date' })
    @IsNotEmpty({ message: 'Tanggal daftar kasasi is required' })
    tanggalDaftarKasasi: string;
}

export class BulkPromoteToKasasiDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BulkPromoteToKasasiItemDto)
    @ArrayMinSize(1)
    items: BulkPromoteToKasasiItemDto[];
}

export class GenerateBeritaAcaraDto {
    @IsArray()
    @IsUUID('4', { each: true })
    @ArrayMinSize(1)
    upayaHukumIds: string[];

    @IsUUID('4', { message: 'Pihak Pertama id must be UUID' })
    @IsNotEmpty({ message: 'Pihak Pertama is required' })
    pihakPertamaId: string;

    @IsUUID('4', { message: 'Pihak Kedua id must be UUID' })
    @IsNotEmpty({ message: 'Pihak Kedua is required' })
    pihakKeduaId: string;

    @IsString()
    @IsOptional()
    requesterRole?: string;
}
