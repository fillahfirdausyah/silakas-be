import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsUUID,
    IsNotEmpty,
    IsEnum,
    IsOptional,
    IsString,
    IsBoolean,
    MaxLength,
} from 'class-validator';
import { DocumentClassificationType } from '../../../../entities/document-classification.entity';

export class UpdateDocumentClassificationDto {
    @ApiProperty({ format: 'uuid' })
    @IsUUID('4', { message: 'ID harus UUID' })
    @IsNotEmpty({ message: 'ID wajib diisi' })
    id: string;

    @ApiPropertyOptional({ example: 'Perdata' })
    @IsOptional()
    @IsString({ message: 'Nama harus berupa string' })
    @MaxLength(255, { message: 'Nama maksimal 255 karakter' })
    name?: string;

    @ApiPropertyOptional({ example: 'PDT' })
    @IsOptional()
    @IsString({ message: 'Kode harus berupa string' })
    @MaxLength(50, { message: 'Kode maksimal 50 karakter' })
    code?: string;

    @ApiPropertyOptional({
        enum: DocumentClassificationType,
        example: DocumentClassificationType.GUGATAN,
    })
    @IsOptional()
    @IsEnum(DocumentClassificationType, {
        message: 'Tipe harus salah satu dari: gugatan, permohonan',
    })
    type?: DocumentClassificationType;

    @ApiPropertyOptional({ example: 'Klasifikasi dokumen perdata' })
    @IsOptional()
    @IsString({ message: 'Deskripsi harus berupa string' })
    @MaxLength(500, { message: 'Deskripsi maksimal 500 karakter' })
    description?: string;

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean({ message: 'Status aktif harus berupa boolean' })
    isActive?: boolean;
}
