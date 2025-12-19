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
import { LawsuitStatus } from '../../../../entities/lawsuit.entity';
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
            if (!lawsuit) throw new NotFoundException('Lawsuit not found');
            return { payload: lawsuit };
        } catch (error) {
            this.logger.error(error.stack || error);
            handleServiceError(error);
        }
    }

    public async create(userId: string, dto: CreateLawsuitDto) {
        try {
            const user = await this.usersRepository.findById(userId);
            if (!user) throw new NotFoundException('User not found');

            const existing = await this.lawsuitsRepository.findByCaseNumber(
                dto.caseNumber,
            );
            if (existing)
                throw new ConflictException('Case number already exists');

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
            if (!lawsuit) throw new NotFoundException('Lawsuit not found');

            // Ideally check if status is DRAFT
            if (lawsuit.status !== LawsuitStatus.DRAFT) {
                throw new BadRequestException(
                    'Lawsuit must be in DRAFT to handover',
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
            if (!user) throw new NotFoundException('User not found');

            const lawsuit = await this.lawsuitsRepository.findById(id);
            if (!lawsuit) throw new NotFoundException('Lawsuit not found');

            if (lawsuit.status !== LawsuitStatus.SUBMITTED_TO_GUGATAN) {
                throw new BadRequestException(
                    'Lawsuit is not waiting for Gugatan',
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
            if (!lawsuit) throw new NotFoundException('Lawsuit not found');

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
            if (!lawsuit) throw new NotFoundException('Lawsuit not found');

            if (lawsuit.status !== LawsuitStatus.RECEIVED_BY_GUGATAN) {
                throw new BadRequestException(
                    'Lawsuit must be received by Gugatan first',
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
            if (!user) throw new NotFoundException('User not found');

            const lawsuit = await this.lawsuitsRepository.findById(id);
            if (!lawsuit) throw new NotFoundException('Lawsuit not found');

            if (lawsuit.status !== LawsuitStatus.SUBMITTED_TO_HUKUM) {
                throw new BadRequestException(
                    'Lawsuit is not waiting for Hukum',
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
}
