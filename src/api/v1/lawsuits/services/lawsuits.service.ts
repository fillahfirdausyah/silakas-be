import {
    ConflictException,
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LawsuitsRepository } from '../repositories/lawsuits.repository';
import {
    CreateLawsuitDto,
    GenerateExcelDto,
    UpdateLawsuitDto,
} from '../dtos/lawsuit.dto';
import { UsersRepository } from '../../users/repositories/users.repository';
import {
    LawsuitStatus,
    LawsuitEntity,
} from '../../../../entities/lawsuit.entity';
import { DocumentClassificationEntity } from '../../../../entities/document-classification.entity';
import { handleServiceError } from '../../../../shared/utils/handler-service-error.util';
import * as ExcelJS from 'exceljs';

@Injectable()
export class LawsuitsService {
    private logger = new Logger(LawsuitsService.name);

    constructor(
        private readonly lawsuitsRepository: LawsuitsRepository,
        private readonly usersRepository: UsersRepository,
        @InjectRepository(DocumentClassificationEntity)
        private readonly documentClassificationRepository: Repository<DocumentClassificationEntity>,
    ) {}

    public async findAll(metadata: {
        page: number;
        limit: number;
        search: string;
        sortBy: string;
        sortType: string;
    }) {
        try {
            const [lawsuits, count] =
                await this.lawsuitsRepository.findByPagination(metadata);
            const maxPages = count > 0 ? Math.ceil(count / metadata.limit) : 1;
            return {
                payload: lawsuits,
                metadata: { ...metadata, maxPages, total: count },
            };
        } catch (error) {
            this.logger.error(error.stack || error);
            handleServiceError(error);
        }
    }

    public async findOne(id: string) {
        try {
            const lawsuit = await this.lawsuitsRepository.findById(id);
            if (!lawsuit)
                throw new NotFoundException('Berkas gugatan tidak ditemukan');

            const timeline = this.generateTimeline(lawsuit);

            return {
                payload: {
                    ...lawsuit,
                    timeline: timeline.steps,
                    currentStep: timeline.currentStep,
                },
            };
        } catch (error) {
            this.logger.error(error.stack || error);
            handleServiceError(error);
        }
    }

    public async create(userId: string, dto: CreateLawsuitDto) {
        try {
            // Get the authenticated user for fallback PP assignment
            const authUser = await this.usersRepository.findById(userId);
            if (!authUser)
                throw new NotFoundException('Pengguna tidak ditemukan');

            const existing = await this.lawsuitsRepository.findByCaseNumber(
                dto.caseNumber,
            );
            if (existing)
                throw new ConflictException('Nomor perkara sudah ada');

            const documentClassification =
                await this.documentClassificationRepository.findOne({
                    where: { id: dto.documentClassificationId },
                });
            if (!documentClassification)
                throw new NotFoundException(
                    'Klasifikasi dokumen tidak ditemukan',
                );

            // Resolve PP user: use provided ppId or fall back to authenticated user
            let ppUser = authUser;
            if (dto.ppId) {
                const pp = await this.usersRepository.findById(dto.ppId);
                if (!pp)
                    throw new NotFoundException(
                        'Pengguna Panitera Pengganti tidak ditemukan',
                    );
                ppUser = pp;
            }

            // Resolve JS user if provided
            let jsUser = null;
            if (dto.jsId) {
                const js = await this.usersRepository.findById(dto.jsId);
                if (!js)
                    throw new NotFoundException(
                        'Pengguna Juru Sita tidak ditemukan',
                    );
                jsUser = js;
            }

            const lawsuit = await this.lawsuitsRepository.create({
                caseNumber: dto.caseNumber,
                decisionDate: new Date(dto.decisionDate),
                classification: documentClassification.name,
                documentClassification,
                pp: ppUser,
                js: jsUser,
                status: LawsuitStatus.DRAFT,
            });

            return { payload: lawsuit };
        } catch (error) {
            this.logger.error(error.stack || error);
            handleServiceError(error);
        }
    }

    // PP -> Gugatan
    public async handoverToGugatan(id: string) {
        try {
            const lawsuit = await this.lawsuitsRepository.findById(id);
            if (!lawsuit)
                throw new NotFoundException('Berkas gugatan tidak ditemukan');

            // Ideally check if status is DRAFT
            if (lawsuit.status !== LawsuitStatus.DRAFT) {
                throw new BadRequestException(
                    'Berkas gugatan harus dalam status DRAFT untuk diserahkan',
                );
            }

            lawsuit.status = LawsuitStatus.SUBMITTED_TO_GUGATAN;
            lawsuit.submittedToGugatanAt = new Date();
            await this.lawsuitsRepository.save(lawsuit);

            return { payload: lawsuit };
        } catch (error) {
            this.logger.error(error.stack || error);
            handleServiceError(error);
        }
    }

    // Gugatan Receive
    public async receiveByGugatan(id: string, userId: string) {
        try {
            const user = await this.usersRepository.findById(userId);
            if (!user) throw new NotFoundException('Pengguna tidak ditemukan');

            const lawsuit = await this.lawsuitsRepository.findById(id);
            if (!lawsuit)
                throw new NotFoundException('Berkas gugatan tidak ditemukan');

            if (lawsuit.status !== LawsuitStatus.SUBMITTED_TO_GUGATAN) {
                throw new BadRequestException(
                    'Berkas gugatan tidak menunggu Panmud Gugatan',
                );
            }

            lawsuit.status = LawsuitStatus.RECEIVED_BY_GUGATAN;
            lawsuit.receivedByGugatanAt = new Date();
            lawsuit.panmudGugatan = user;
            await this.lawsuitsRepository.save(lawsuit);

            return { payload: lawsuit };
        } catch (error) {
            this.logger.error(error.stack || error);
            handleServiceError(error);
        }
    }

    // Gugatan Update (PBT, BHT, Ikrar, PP, JS)
    public async updateDetails(id: string, dto: UpdateLawsuitDto) {
        try {
            const lawsuit = await this.lawsuitsRepository.findById(id);
            if (!lawsuit)
                throw new NotFoundException('Berkas gugatan tidak ditemukan');

            if (dto.pbtDate) lawsuit.pbtDate = new Date(dto.pbtDate);
            if (dto.bhtDate) lawsuit.bhtDate = new Date(dto.bhtDate);
            if (dto.ikrarDate) lawsuit.ikrarDate = new Date(dto.ikrarDate);

            // Update PP if provided
            if (dto.ppId) {
                const ppUser = await this.usersRepository.findById(dto.ppId);
                if (!ppUser)
                    throw new NotFoundException(
                        'Pengguna Panitera Pengganti tidak ditemukan',
                    );
                lawsuit.pp = ppUser;
            }

            // Update JS if provided
            if (dto.jsId) {
                const jsUser = await this.usersRepository.findById(dto.jsId);
                if (!jsUser)
                    throw new NotFoundException(
                        'Pengguna Juru Sita tidak ditemukan',
                    );
                lawsuit.js = jsUser;
            }

            await this.lawsuitsRepository.save(lawsuit);
            return { payload: lawsuit };
        } catch (error) {
            this.logger.error(error.stack || error);
            handleServiceError(error);
        }
    }

    // Gugatan -> Hukum
    public async handoverToHukum(id: string) {
        try {
            const lawsuit = await this.lawsuitsRepository.findById(id);
            if (!lawsuit)
                throw new NotFoundException('Berkas gugatan tidak ditemukan');

            if (lawsuit.status !== LawsuitStatus.RECEIVED_BY_GUGATAN) {
                throw new BadRequestException(
                    'Berkas gugatan harus diterima oleh Panmud Gugatan terlebih dahulu',
                );
            }

            lawsuit.status = LawsuitStatus.SUBMITTED_TO_HUKUM;
            lawsuit.submittedToHukumAt = new Date();
            await this.lawsuitsRepository.save(lawsuit);

            return { payload: lawsuit };
        } catch (error) {
            this.logger.error(error.stack || error);
            handleServiceError(error);
        }
    }

    // Hukum Receive
    public async receiveByHukum(id: string, userId: string) {
        try {
            const user = await this.usersRepository.findById(userId);
            if (!user) throw new NotFoundException('Pengguna tidak ditemukan');

            const lawsuit = await this.lawsuitsRepository.findById(id);
            if (!lawsuit)
                throw new NotFoundException('Berkas gugatan tidak ditemukan');

            if (lawsuit.status !== LawsuitStatus.SUBMITTED_TO_HUKUM) {
                throw new BadRequestException(
                    'Berkas gugatan tidak menunggu Panmud Hukum',
                );
            }

            lawsuit.status = LawsuitStatus.RECEIVED_BY_HUKUM;
            lawsuit.receivedByHukumAt = new Date();
            lawsuit.panmudHukum = user;
            await this.lawsuitsRepository.save(lawsuit);

            return { payload: lawsuit };
        } catch (error) {
            this.logger.error(error.stack || error);
            handleServiceError(error);
        }
    }

    public async generateExcelReport() {
        try {
            const [lawsuits] = await this.lawsuitsRepository.findByPagination({
                page: 1,
                limit: 10000,
                search: '',
                sortBy: 'created_at',
                sortType: 'DESC',
            });
            // findByPagination returns [items, count]

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Laporan Gugatan');

            worksheet.columns = [
                { header: 'No. Perkara', key: 'caseNumber', width: 25 },
                { header: 'Tanggal Putusan', key: 'decisionDate', width: 15 },
                { header: 'Klasifikasi', key: 'classification', width: 20 },
                { header: 'Status', key: 'status', width: 20 },
                { header: 'PP', key: 'pp', width: 20 },
                { header: 'PBT', key: 'pbt', width: 15 },
                { header: 'BHT', key: 'bht', width: 15 },
                { header: 'Ikrar', key: 'ikrar', width: 15 },
            ];

            lawsuits.forEach((lawsuit) => {
                worksheet.addRow({
                    caseNumber: lawsuit.caseNumber,
                    decisionDate: lawsuit.decisionDate,
                    classification: lawsuit.classification,
                    status: lawsuit.status,
                    pp: lawsuit.pp ? lawsuit.pp.fullName : '-',
                    pbt: lawsuit.pbtDate || '-',
                    bht: lawsuit.bhtDate || '-',
                    ikrar: lawsuit.ikrarDate || '-',
                });
            });

            const buffer = await workbook.xlsx.writeBuffer();
            return { payload: buffer };
        } catch (error) {
            this.logger.error(error.stack || error);
            handleServiceError(error);
        }
    }

    public async generateBeritaAcara(dto: GenerateExcelDto) {
        try {
            const lawsuits = await this.lawsuitsRepository.findByIds(
                dto.lawsuitIds,
            );

            if (lawsuits.length !== dto.lawsuitIds.length) {
                const foundIds = new Set(lawsuits.map((l) => l.id));
                const missingIds = dto.lawsuitIds.filter(
                    (id) => !foundIds.has(id),
                );
                throw new NotFoundException(
                    `Berkas gugatan tidak ditemukan: ${missingIds.join(', ')}`,
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

            // Row 1: Title
            worksheet.mergeCells('A1:H1');
            const titleCell = worksheet.getCell('A1');
            titleCell.value = 'BERITA ACARA PENYERAHAN BERKAS PERKARA GUGATAN';
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
            handoverCell.value =
                'Pihak Pertama menyerahkan berkas perkara kepada pihak Kedua dan Pihak Kedua menyatakan telah menerima dari Pihak Pertama berupa berkas gugatan yang telah berkekuatan hukum tetap, yaitu:';
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
            lawsuits.forEach((lawsuit, index) => {
                const rowNum = headerRow + 1 + index;
                const caseNumberParts = lawsuit.caseNumber.split('/');
                const caseNumPrefix = caseNumberParts[0];
                const caseNumSuffix = '/' + caseNumberParts.slice(1).join('/');

                worksheet.getCell(`A${rowNum}`).value = index + 1;
                worksheet.getCell(`B${rowNum}`).value = caseNumPrefix;
                worksheet.getCell(`C${rowNum}`).value = caseNumSuffix;
                worksheet.getCell(`D${rowNum}`).value = lawsuit.createdAt
                    ? formatShortDate(lawsuit.createdAt)
                    : '';
                worksheet.getCell(`E${rowNum}`).value = lawsuit.bhtDate
                    ? formatShortDate(lawsuit.bhtDate)
                    : '';
                worksheet.getCell(`F${rowNum}`).value = lawsuit.ikrarDate
                    ? formatShortDate(lawsuit.ikrarDate)
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
            const footerStart = headerRow + 1 + lawsuits.length + 1;

            worksheet.mergeCells(`A${footerStart}:H${footerStart + 1}`);
            const closingCell = worksheet.getCell(`A${footerStart}`);
            closingCell.value =
                'Demikian berita acara serah terima berkas perkara gugatan ini dibuat oleh kedua belah pihak, agar berkas perkara tersebut dapat diarsipkan.';
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

    private generateTimeline(lawsuit: LawsuitEntity) {
        const steps = [
            {
                title: 'Perkara Minutasi',
                description: `Didaftarkan oleh ${lawsuit.pp?.fullName || 'PP'}`,
                status: 'finish',
                date: lawsuit.createdAt,
                user: lawsuit.pp,
            },
            {
                title: 'Verifikasi Panmud Gugatan',
                description: 'Berkas diserahkan ke Panmud Gugatan',
                status: 'wait',
                date: lawsuit.submittedToGugatanAt,
                user: lawsuit.panmudGugatan,
            },
            {
                title: 'Proses BHT',
                description: 'Verifikasi dan kelengkapan data',
                status: 'wait',
                date: lawsuit.receivedByGugatanAt,
                user: lawsuit.panmudGugatan,
            },
            {
                title: 'Arsip Panmud Hukum',
                description: 'Berkas diserahkan ke Panmud Hukum',
                status: 'wait',
                date: lawsuit.submittedToHukumAt,
                user: lawsuit.panmudHukum,
            },
        ];

        let currentStep = 0;

        // Determine step status based on current lawsuit status
        // Step 1: Registrasi - initialized as finish

        // Step 2: Handover to Gugatan
        if (lawsuit.status !== LawsuitStatus.DRAFT) {
            steps[1].status = 'finish';
            currentStep = 1;
        } else {
            steps[1].status = 'process'; // Current active step for next action
            currentStep = 0; // Completed 0, working on 1? Logic depends on frontend "current" usually 0-indexed active step
        }

        // Wait, current typically means "active" step or "last completed"?
        // Frontend example: current={2} means step index 2 is active/process. 0,1 are done.

        if (lawsuit.status === LawsuitStatus.DRAFT) {
            currentStep = 0;
            steps[1].status = 'wait';
        } else if (lawsuit.status === LawsuitStatus.SUBMITTED_TO_GUGATAN) {
            currentStep = 1;
            steps[1].status = 'process';
            steps[0].status = 'finish';
        } else if (lawsuit.status === LawsuitStatus.RECEIVED_BY_GUGATAN) {
            currentStep = 2;
            steps[1].status = 'finish';
            steps[2].status = 'process';
        } else if (lawsuit.status === LawsuitStatus.SUBMITTED_TO_HUKUM) {
            currentStep = 3;
            steps[2].status = 'finish';
            steps[3].status = 'process';
        } else if (lawsuit.status === LawsuitStatus.RECEIVED_BY_HUKUM) {
            currentStep = 4; // All done
            steps[3].status = 'finish';
            // Maybe add a 5th step "Selesai" or just keep 4 as finished
        }

        // Adjust for received dates
        if (lawsuit.receivedByHukumAt) {
            steps[3].status = 'finish';
            steps[3].description = `Diterima oleh ${lawsuit.panmudHukum?.fullName || 'Panmud Hukum'}`;
            steps[3].date = lawsuit.receivedByHukumAt;
        }

        return { steps, currentStep };
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
