import {
    BadRequestException,
    ConflictException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { LawsuitStatus } from '../../../../entities/lawsuit.entity';
import { UpayaHukumType } from '../../../../entities/upaya-hukum.entity';
import { handleServiceError } from '../../../../shared/utils/handler-service-error.util';
import { LawsuitsRepository } from '../../lawsuits/repositories/lawsuits.repository';
import {
    CreateUpayaHukumDto,
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
            if (lawsuit.status !== LawsuitStatus.RECEIVED_BY_GUGATAN) {
                throw new BadRequestException(
                    'Berkas gugatan harus sudah diterima oleh Panmud Gugatan',
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
}
