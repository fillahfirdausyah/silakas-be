import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImpersonationAuditLogEntity } from '../../entities/impersonation-audit-log.entity';

@Injectable()
export class ImpersonationAuditService {
    constructor(
        @InjectRepository(ImpersonationAuditLogEntity)
        private readonly auditLogRepository: Repository<ImpersonationAuditLogEntity>,
    ) {}

    async logImpersonationStart(data: {
        userId: string;
        originalRole: string;
        impersonatedRole: string;
        ipAddress?: string;
        deviceInfo?: string;
    }): Promise<void> {
        const logEntry = this.auditLogRepository.create({
            userId: data.userId,
            action: 'IMPERSONATION_START',
            originalRole: data.originalRole,
            impersonatedRole: data.impersonatedRole,
            ipAddress: data.ipAddress ?? null,
            deviceInfo: data.deviceInfo ?? null,
        });

        await this.auditLogRepository.save(logEntry);
    }

    async logImpersonationStop(data: {
        userId: string;
        originalRole: string;
        ipAddress?: string;
        deviceInfo?: string;
    }): Promise<void> {
        const logEntry = this.auditLogRepository.create({
            userId: data.userId,
            action: 'IMPERSONATION_STOP',
            originalRole: data.originalRole,
            impersonatedRole: null,
            ipAddress: data.ipAddress ?? null,
            deviceInfo: data.deviceInfo ?? null,
        });

        await this.auditLogRepository.save(logEntry);
    }

    async getAuditLogsForUser(
        userId: string,
    ): Promise<ImpersonationAuditLogEntity[]> {
        return this.auditLogRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }
}
