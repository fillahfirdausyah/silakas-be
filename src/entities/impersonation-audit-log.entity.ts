import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('impersonation_audit_logs')
export class ImpersonationAuditLogEntity {
    @PrimaryGeneratedColumn('uuid', {
        name: 'id',
        primaryKeyConstraintName: 'pk_impersonation_audit_log_id',
    })
    id: string;

    @Column({
        name: 'user_id',
        type: 'varchar',
        length: 255,
        nullable: false,
    })
    @Index()
    userId: string;

    @Column({
        name: 'action',
        type: 'varchar',
        length: 50,
        nullable: false,
    })
    action: 'IMPERSONATION_START' | 'IMPERSONATION_STOP';

    @Column({
        name: 'original_role',
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    originalRole: string | null;

    @Column({
        name: 'impersonated_role',
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    impersonatedRole: string | null;

    @Column({
        name: 'ip_address',
        type: 'varchar',
        length: 45,
        nullable: true,
    })
    ipAddress: string | null;

    @Column({
        name: 'device_info',
        type: 'varchar',
        length: 500,
        nullable: true,
    })
    deviceInfo: string | null;

    @CreateDateColumn({
        type: 'timestamp',
        name: 'created_at',
    })
    createdAt: Date;
}
