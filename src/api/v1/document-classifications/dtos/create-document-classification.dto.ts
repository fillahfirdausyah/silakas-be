import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';
import { DocumentClassificationType } from '../../../../entities/document-classification.entity';

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

    @ApiProperty({
        required: true,
        enum: DocumentClassificationType,
        example: DocumentClassificationType.GUGATAN,
    })
    @IsEnum(DocumentClassificationType, {
        message: 'Tipe harus salah satu dari: gugatan, permohonan',
    })
    @IsNotEmpty({ message: 'Tipe wajib diisi' })
    type: DocumentClassificationType;

    @ApiPropertyOptional({ example: 'Klasifikasi dokumen perdata' })
    @IsOptional()
    @IsString({ message: 'Deskripsi harus berupa string' })
    @MaxLength(500, { message: 'Deskripsi maksimal 500 karakter' })
    description?: string;
}
