import {
    BadRequestException,
    ConflictException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { LawsuitStatus } from '../../../../entities/lawsuit.entity';
import { UpayaHukumType } from '../../../../entities/upaya-hukum.entity';
import { handleServiceError } from '../../../../shared/utils/handler-service-error.util';
import { LawsuitsRepository } from '../../lawsuits/repositories/lawsuits.repository';
import {
    BulkCreateUpayaHukumDto,
    BulkPromoteToKasasiDto,
    CreateUpayaHukumDto,
    GenerateBeritaAcaraDto,
    GetUpayaHukumDto,
    PromoteToKasasiDto,
    UpdateUpayaHukumDto,
} from '../dtos/upaya-hukum.dto';
import { UpayaHukumRepository } from '../repositories/upaya-hukum.repository';

@Injectable()
export class UpayaHukumService {
    private logger = new Logger(UpayaHukumService.name);

    constructor(
        private readonly upayaHukumRepository: UpayaHukumRepository,
        private readonly lawsuitsRepository: LawsuitsRepository,
    ) {}

    async findAll(query: GetUpayaHukumDto) {
        try {
            const type = query.type || UpayaHukumType.BANDING;
            const upayaHukumList =
                await this.upayaHukumRepository.findByType(type);

            const payload = upayaHukumList.map((uh) => ({
                id: uh.id,
                lawsuitId: uh.lawsuitId,
                lawsuitCaseNumber: uh.lawsuit.caseNumber,
                type: uh.type,
                tanggalDaftar: uh.tanggalDaftar,
                tanggalDaftarBanding: uh.tanggalDaftarBanding,
                tanggalDaftarKasasi: uh.tanggalDaftarKasasi,
                tanggalPutus: uh.lawsuit.decisionDate,
                tanggalPBT: uh.lawsuit.pbtDate,
                tanggalBHT: uh.lawsuit.bhtDate,
                createdAt: uh.createdAt,
                updatedAt: uh.updatedAt,
            }));

            return { payload };
        } catch (error) {
            this.logger.error(error.stack || error);
            handleServiceError(error);
        }
    }

    async create(dto: CreateUpayaHukumDto) {
        try {
            const lawsuit = await this.lawsuitsRepository.findById(
                dto.lawsuitId,
            );
            if (!lawsuit) {
                throw new NotFoundException('Berkas gugatan tidak ditemukan');
            }

            // Check lawsuit type
            if (lawsuit.type !== 'gugatan' && lawsuit.type !== 'permohonan') {
                throw new BadRequestException(
                    'Hanya berkas dengan tipe Gugatan atau Permohonan yang dapat dimasukkan ke Upaya Hukum',
                );
            }

            // Check lawsuit status
            if (
                lawsuit.status !== LawsuitStatus.RECEIVED_BY_GUGATAN &&
                lawsuit.status !== LawsuitStatus.RECEIVED_BY_PERMOHONAN
            ) {
                throw new BadRequestException(
                    'Berkas gugatan harus sudah diterima oleh Panmud Gugatan atau Panmud Permohonan',
                );
            }

            // Check if already in upaya hukum
            const existing = await this.upayaHukumRepository.findByLawsuitId(
                dto.lawsuitId,
            );
            if (existing) {
                throw new ConflictException(
                    'Berkas gugatan sudah ada di Upaya Hukum',
                );
            }

            const upayaHukum = await this.upayaHukumRepository.create({
                lawsuitId: dto.lawsuitId,
                type: UpayaHukumType.BANDING,
                tanggalDaftar: new Date(dto.tanggalDaftar),
                tanggalDaftarBanding: new Date(dto.tanggalDaftar),
                tanggalDaftarKasasi: null,
            });

            return { payload: upayaHukum };
        } catch (error) {
            this.logger.error(error.stack || error);
            handleServiceError(error);
        }
    }

    async bulkCreate(dto: BulkCreateUpayaHukumDto) {
        const results = [];
        const errors: string[] = [];

        for (const item of dto.items) {
            try {
                const lawsuit = await this.lawsuitsRepository.findById(
                    item.lawsuitId,
                );
                if (!lawsuit) {
                    errors.push(`${item.lawsuitId}: Berkas tidak ditemukan`);
                    continue;
                }

                if (
                    lawsuit.type !== 'gugatan' &&
                    lawsuit.type !== 'permohonan'
                ) {
                    errors.push(
                        `${lawsuit.caseNumber}: Tipe berkas tidak valid`,
                    );
                    continue;
                }

                if (
                    lawsuit.status !== LawsuitStatus.RECEIVED_BY_GUGATAN &&
                    lawsuit.status !== LawsuitStatus.RECEIVED_BY_PERMOHONAN
                ) {
                    errors.push(
                        `${lawsuit.caseNumber}: Berkas belum diterima oleh Panmud`,
                    );
                    continue;
                }

                const existing =
                    await this.upayaHukumRepository.findByLawsuitId(
                        item.lawsuitId,
                    );
                if (existing) {
                    errors.push(
                        `${lawsuit.caseNumber}: Sudah ada di Upaya Hukum`,
                    );
                    continue;
                }

                const upayaHukum = await this.upayaHukumRepository.create({
                    lawsuitId: item.lawsuitId,
                    type: UpayaHukumType.BANDING,
                    tanggalDaftar: new Date(item.tanggalDaftar),
                    tanggalDaftarBanding: new Date(item.tanggalDaftar),
                    tanggalDaftarKasasi: null,
                });

                results.push(upayaHukum);
            } catch (error) {
                this.logger.error(
                    `Bulk create upaya hukum error for ${item.lawsuitId}: ${error.message}`,
                );
                errors.push(`${item.lawsuitId}: ${error.message}`);
            }
        }

        if (results.length === 0 && errors.length > 0) {
            throw new BadRequestException(errors.join('; '));
        }

        return {
            payload: results,
            errors: errors.length > 0 ? errors : undefined,
        };
    }

    async promoteToKasasi(id: string, dto: PromoteToKasasiDto) {
        try {
            const upayaHukum = await this.upayaHukumRepository.findById(id);
            if (!upayaHukum) {
                throw new NotFoundException('Data Upaya Hukum tidak ditemukan');
            }

            if (upayaHukum.type !== UpayaHukumType.BANDING) {
                throw new BadRequestException(
                    'Hanya data dengan tipe BANDING yang dapat dipromosikan ke KASASI',
                );
            }

            upayaHukum.type = UpayaHukumType.KASASI;
            upayaHukum.tanggalDaftarKasasi = new Date(dto.tanggalDaftarKasasi);
            upayaHukum.tanggalDaftar = new Date(dto.tanggalDaftarKasasi); // Update current registration date

            await this.upayaHukumRepository.save(upayaHukum);

            return { payload: upayaHukum };
        } catch (error) {
            this.logger.error(error.stack || error);
            handleServiceError(error);
        }
    }

    async bulkPromoteToKasasi(dto: BulkPromoteToKasasiDto) {
        const results = [];
        const errors: string[] = [];

        for (const item of dto.items) {
            try {
                const upayaHukum = await this.upayaHukumRepository.findById(
                    item.upayaHukumId,
                );
                if (!upayaHukum) {
                    errors.push(
                        `${item.upayaHukumId}: Data Upaya Hukum tidak ditemukan`,
                    );
                    continue;
                }

                if (upayaHukum.type !== UpayaHukumType.BANDING) {
                    errors.push(
                        `${upayaHukum.lawsuit?.caseNumber || item.upayaHukumId}: Hanya tipe BANDING yang dapat dipromosikan`,
                    );
                    continue;
                }

                upayaHukum.type = UpayaHukumType.KASASI;
                upayaHukum.tanggalDaftarKasasi = new Date(
                    item.tanggalDaftarKasasi,
                );
                upayaHukum.tanggalDaftar = new Date(item.tanggalDaftarKasasi);

                await this.upayaHukumRepository.save(upayaHukum);
                results.push(upayaHukum);
            } catch (error) {
                this.logger.error(
                    `Bulk promote to kasasi error for ${item.upayaHukumId}: ${error.message}`,
                );
                errors.push(`${item.upayaHukumId}: ${error.message}`);
            }
        }

        if (results.length === 0 && errors.length > 0) {
            throw new BadRequestException(errors.join('; '));
        }

        return {
            payload: results,
            errors: errors.length > 0 ? errors : undefined,
        };
    }

    async update(id: string, dto: UpdateUpayaHukumDto) {
        try {
            const upayaHukum = await this.upayaHukumRepository.findById(id);
            if (!upayaHukum) {
                throw new NotFoundException('Data Upaya Hukum tidak ditemukan');
            }

            // Update tanggalDaftar based on current type
            upayaHukum.tanggalDaftar = new Date(dto.tanggalDaftar);

            // Also update the specific date based on type
            if (upayaHukum.type === UpayaHukumType.BANDING) {
                upayaHukum.tanggalDaftarBanding = new Date(dto.tanggalDaftar);
            } else if (upayaHukum.type === UpayaHukumType.KASASI) {
                upayaHukum.tanggalDaftarKasasi = new Date(dto.tanggalDaftar);
            }

            await this.upayaHukumRepository.save(upayaHukum);

            return { payload: upayaHukum };
        } catch (error) {
            this.logger.error(error.stack || error);
            handleServiceError(error);
        }
    }

    async generateBeritaAcara(dto: GenerateBeritaAcaraDto) {
        try {
            const upayaHukumList = await this.upayaHukumRepository.findByIds(
                dto.upayaHukumIds,
            );

            if (upayaHukumList.length !== dto.upayaHukumIds.length) {
                const foundIds = new Set(upayaHukumList.map((uh) => uh.id));
                const missingIds = dto.upayaHukumIds.filter(
                    (id) => !foundIds.has(id),
                );
                throw new NotFoundException(
                    `Data Upaya Hukum tidak ditemukan: ${missingIds.join(', ')}`,
                );
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Berita Acara');

            // Column widths matching the template layout
            worksheet.columns = [
                { width: 5 }, // A: No.
                { width: 8 }, // B: Case number part
                { width: 22 }, // C: Case format part
                { width: 15 }, // D: Putus Tanggal
                { width: 15 }, // E: Tanggal BHT
                { width: 15 }, // F: Ikrar Tanggal
                { width: 12 }, // G: Ket
                { width: 5 }, // H: extra space
            ];

            const thinBorder: Partial<ExcelJS.Borders> = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };

            // Determine type for title
            const type = upayaHukumList[0]?.type || UpayaHukumType.BANDING;
            const typeLabel =
                type === UpayaHukumType.BANDING ? 'BANDING' : 'KASASI';

            // Row 1: Title
            worksheet.mergeCells('A1:H1');
            const titleCell = worksheet.getCell('A1');
            titleCell.value = `BERITA ACARA PENYERAHAN BERKAS PERKARA ${typeLabel}`;
            titleCell.font = { bold: true, size: 14 };
            titleCell.alignment = { horizontal: 'center' };

            // Row 2: blank
            // Row 3: Date paragraph
            const now = new Date();
            const dateText = `Pada hari ini ${formatIndonesianDay(now)} tanggal ${formatIndonesianDate(now)}, saya yang bertanda tangan di bawah ini :`;
            worksheet.mergeCells('A3:H3');
            const dateCell = worksheet.getCell('A3');
            dateCell.value = dateText;
            dateCell.alignment = { wrapText: true };

            // Rows 4-6: Pihak Pertama info
            worksheet.getCell('B4').value = 'Nama';
            worksheet.getCell('C4').value = ': Siti Raudah, S.H.I., M.H.';
            worksheet.getCell('B5').value = 'Jabatan';
            worksheet.getCell('C5').value = ': Panitera Muda Gugatan';
            worksheet.getCell('B6').value = 'Unit Kerja';
            worksheet.getCell('C6').value = ': Pengadilan Agama Banjarmasin';

            // Row 7: "selanjutnya disebut sebagai Pihak Pertama"
            worksheet.mergeCells('A7:H7');
            const pihak1Cell = worksheet.getCell('A7');
            pihak1Cell.value = 'selanjutnya disebut sebagai "Pihak Pertama"';
            pihak1Cell.font = { bold: false };

            // Rows 8-10: Pihak Kedua info
            worksheet.getCell('B8').value = 'Nama';
            worksheet.getCell('C8').value = ': Yulia Erliana Wulandari, S.H.';
            worksheet.getCell('B9').value = 'Jabatan';
            worksheet.getCell('C9').value = ': Panitera Muda Hukum';
            worksheet.getCell('B10').value = 'Unit Kerja';
            worksheet.getCell('C10').value = ': Pengadilan Agama Banjarmasin';

            // Row 11: "selanjutnya disebut sebagai Pihak Kedua"
            worksheet.mergeCells('A11:H11');
            const pihak2Cell = worksheet.getCell('A11');
            pihak2Cell.value = 'selanjutnya disebut sebagai "Pihak Kedua"';

            // Row 12: blank
            // Row 13: Handover paragraph
            worksheet.mergeCells('A13:H14');
            const handoverCell = worksheet.getCell('A13');
            handoverCell.value = `Pihak Pertama menyerahkan berkas perkara kepada pihak Kedua dan Pihak Kedua menyatakan telah menerima dari Pihak Pertama berupa berkas ${typeLabel.toLowerCase()} yang telah berkekuatan hukum tetap, yaitu:`;
            handoverCell.alignment = { wrapText: true, vertical: 'top' };

            // Row 16: Table header
            const headerRow = 16;
            const headers = [
                'No.',
                '',
                'Nomor Perkara',
                'Putus Tanggal',
                'Tanggal BHT',
                'Ikrar Tanggal',
                'Ket',
            ];
            // Merge B and C for "Nomor Perkara" header
            worksheet.mergeCells(`B${headerRow}:C${headerRow}`);
            worksheet.getCell(`A${headerRow}`).value = headers[0];
            worksheet.getCell(`B${headerRow}`).value = 'Nomor Perkara';
            worksheet.getCell(`D${headerRow}`).value = headers[3];
            worksheet.getCell(`E${headerRow}`).value = headers[4];
            worksheet.getCell(`F${headerRow}`).value = headers[5];
            worksheet.getCell(`G${headerRow}`).value = headers[6];

            // Style header cells
            ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach((col) => {
                const cell = worksheet.getCell(`${col}${headerRow}`);
                cell.font = { bold: true };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = thinBorder;
            });

            // Data rows
            upayaHukumList.forEach((uh, index) => {
                const rowNum = headerRow + 1 + index;
                const caseNumberParts = uh.lawsuit.caseNumber.split('/');
                const caseNumPrefix = caseNumberParts[0];
                const caseNumSuffix = '/' + caseNumberParts.slice(1).join('/');

                worksheet.getCell(`A${rowNum}`).value = index + 1;
                worksheet.getCell(`B${rowNum}`).value = caseNumPrefix;
                worksheet.getCell(`C${rowNum}`).value = caseNumSuffix;
                worksheet.getCell(`D${rowNum}`).value = uh.lawsuit.decisionDate
                    ? formatShortDate(uh.lawsuit.decisionDate)
                    : '';
                worksheet.getCell(`E${rowNum}`).value = uh.lawsuit.bhtDate
                    ? formatShortDate(uh.lawsuit.bhtDate)
                    : '';
                worksheet.getCell(`F${rowNum}`).value = uh.lawsuit.ikrarDate
                    ? formatShortDate(uh.lawsuit.ikrarDate)
                    : '';
                worksheet.getCell(`G${rowNum}`).value = '';

                // Style data cells
                ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach((col) => {
                    const cell = worksheet.getCell(`${col}${rowNum}`);
                    cell.border = thinBorder;
                    cell.alignment = { horizontal: 'center' };
                });
            });

            // Footer rows
            const footerStart = headerRow + 1 + upayaHukumList.length + 1;

            worksheet.mergeCells(`A${footerStart}:H${footerStart + 1}`);
            const closingCell = worksheet.getCell(`A${footerStart}`);
            closingCell.value =
                'Demikian berita acara serah terima berkas perkara ini dibuat oleh kedua belah pihak, agar berkas perkara tersebut dapat diarsipkan.';
            closingCell.alignment = { wrapText: true, vertical: 'top' };

            // Signature block
            const sigStart = footerStart + 3;

            worksheet.mergeCells(`A${sigStart}:C${sigStart}`);
            worksheet.getCell(`A${sigStart}`).value = 'Yang menyerahkan';
            worksheet.getCell(`A${sigStart}`).alignment = {
                horizontal: 'center',
            };

            worksheet.mergeCells(`A${sigStart + 1}:C${sigStart + 1}`);
            worksheet.getCell(`A${sigStart + 1}`).value = 'Pihak Pertama';
            worksheet.getCell(`A${sigStart + 1}`).font = { bold: true };
            worksheet.getCell(`A${sigStart + 1}`).alignment = {
                horizontal: 'center',
            };

            worksheet.mergeCells(`E${sigStart}:G${sigStart + 1}`);
            worksheet.getCell(`E${sigStart}`).value = 'Pihak Kedua';
            worksheet.getCell(`E${sigStart}`).font = { bold: true };
            worksheet.getCell(`E${sigStart}`).alignment = {
                horizontal: 'center',
                vertical: 'bottom',
            };

            // Signature names (with space for actual signature)
            const nameRow = sigStart + 5;

            worksheet.mergeCells(`A${nameRow}:C${nameRow}`);
            worksheet.getCell(`A${nameRow}`).value =
                'Siti Raudah, S.H.I., M.H.';
            worksheet.getCell(`A${nameRow}`).alignment = {
                horizontal: 'center',
            };

            worksheet.mergeCells(`E${nameRow}:G${nameRow}`);
            worksheet.getCell(`E${nameRow}`).value =
                'Yulia Erliana Wulandari, S.H.';
            worksheet.getCell(`E${nameRow}`).alignment = {
                horizontal: 'center',
            };

            const buffer = await workbook.xlsx.writeBuffer();
            return { payload: buffer };
        } catch (error) {
            this.logger.error(error.stack || error);
            handleServiceError(error);
        }
    }
}

const INDONESIAN_DAYS = [
    'Minggu',
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    'Jumat',
    'Sabtu',
];

const INDONESIAN_MONTHS = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
];

function formatIndonesianDay(date: Date): string {
    return INDONESIAN_DAYS[date.getDay()];
}

function formatIndonesianDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = INDONESIAN_MONTHS[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
}

function formatShortDate(date: Date): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
}
