import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

export class CreateDocumentClassificationDto {
    @ApiProperty({ required: true, example: 'Perdata' })
    @IsString({ message: 'Nama harus berupa string' })
    @IsNotEmpty({ message: 'Nama wajib diisi' })
    @MaxLength(255, { message: 'Nama maksimal 255 karakter' })
    name: string;

    @ApiProperty({ required: true, example: 'PDT' })
    @IsString({ message: 'Kode harus berupa string' })
    @IsNotEmpty({ message: 'Kode wajib diisi' })
    @MaxLength(50, { message: 'Kode maksimal 50 karakter' })
    code: string;

    @ApiPropertyOptional({ example: 'Klasifikasi dokumen perdata' })
    @IsOptional()
    @IsString({ message: 'Deskripsi harus berupa string' })
    @MaxLength(500, { message: 'Deskripsi maksimal 500 karakter' })
    description?: string;
}