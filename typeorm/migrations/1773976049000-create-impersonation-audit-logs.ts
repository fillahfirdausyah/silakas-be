import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableIndex,
} from 'typeorm';

export class CreateImpersonationAuditLogs1773976049000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'impersonation_audit_logs',
                columns: [
                    {
                        name: 'id',
                        type: 'varchar',
                        length: '36',
                        isPrimary: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'user_id',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'action',
                        type: 'varchar',
                        length: '50',
                        isNullable: false,
                    },
                    {
                        name: 'original_role',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'impersonated_role',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'ip_address',
                        type: 'varchar',
                        length: '45',
                        isNullable: true,
                    },
                    {
                        name: 'device_info',
                        type: 'varchar',
                        length: '500',
                        isNullable: true,
                    },
                ],
            }),
            true,
        );

        // Create index on user_id for fast lookups
        await queryRunner.createIndex(
            'impersonation_audit_logs',
            new TableIndex({
                name: 'IDX_impersonation_audit_logs_user_id',
                columnNames: ['user_id'],
            }),
        );

        // Create index on action for filtering by action type
        await queryRunner.createIndex(
            'impersonation_audit_logs',
            new TableIndex({
                name: 'IDX_impersonation_audit_logs_action',
                columnNames: ['action'],
            }),
        );

        // Create index on created_at for time-based queries
        await queryRunner.createIndex(
            'impersonation_audit_logs',
            new TableIndex({
                name: 'IDX_impersonation_audit_logs_created_at',
                columnNames: ['created_at'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex(
            'impersonation_audit_logs',
            'IDX_impersonation_audit_logs_created_at',
        );
        await queryRunner.dropIndex(
            'impersonation_audit_logs',
            'IDX_impersonation_audit_logs_action',
        );
        await queryRunner.dropIndex(
            'impersonation_audit_logs',
            'IDX_impersonation_audit_logs_user_id',
        );
        await queryRunner.dropTable('impersonation_audit_logs');
    }
}
