import {
    ArrayMinSize,
    IsArray,
    IsDateString,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsUUID,
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

export class GenerateBeritaAcaraDto {
    @IsArray()
    @IsUUID('4', { each: true })
    @ArrayMinSize(1)
    upayaHukumIds: string[];
}
