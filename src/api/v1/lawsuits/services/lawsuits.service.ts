import {
    ConflictException,
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { LawsuitsRepository } from '../repositories/lawsuits.repository';
import { CreateLawsuitDto, UpdateLawsuitDto } from '../dtos/lawsuit.dto';
import { UsersRepository } from '../../users/repositories/users.repository';
import {
    LawsuitStatus,
    LawsuitEntity,
} from '../../../../entities/lawsuit.entity';
import { handleServiceError } from '../../../../shared/utils/handler-service-error.util';
import * as ExcelJS from 'exceljs';

@Injectable()
export class LawsuitsService {
    private logger = new Logger(LawsuitsService.name);

    constructor(
        private readonly lawsuitsRepository: LawsuitsRepository,
        private readonly usersRepository: UsersRepository,
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
            const user = await this.usersRepository.findById(userId);
            if (!user) throw new NotFoundException('Pengguna tidak ditemukan');

            const existing = await this.lawsuitsRepository.findByCaseNumber(
                dto.caseNumber,
            );
            if (existing)
                throw new ConflictException('Nomor perkara sudah ada');

            const lawsuit = await this.lawsuitsRepository.create({
                ...dto,
                decisionDate: new Date(dto.decisionDate),
                pp: user,
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

    // Gugatan Update (PBT, BHT, Ikrar)
    public async updateDetails(id: string, dto: UpdateLawsuitDto) {
        try {
            const lawsuit = await this.lawsuitsRepository.findById(id);
            if (!lawsuit)
                throw new NotFoundException('Berkas gugatan tidak ditemukan');

            if (dto.pbtDate) lawsuit.pbtDate = new Date(dto.pbtDate);
            if (dto.bhtDate) lawsuit.bhtDate = new Date(dto.bhtDate);
            if (dto.ikrarDate) lawsuit.ikrarDate = new Date(dto.ikrarDate);

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

    private generateTimeline(lawsuit: LawsuitEntity) {
        const steps = [
            {
                title: 'Registrasi Perkara',
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
                title: 'Proses Gugatan',
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
