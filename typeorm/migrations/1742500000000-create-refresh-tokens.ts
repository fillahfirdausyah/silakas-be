import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableForeignKey,
    TableIndex,
} from 'typeorm';

export class CreateRefreshTokens1742500000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'refresh_tokens',
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
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        onUpdate: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'deleted_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'token_hash',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'expires_at',
                        type: 'timestamp',
                        isNullable: false,
                    },
                    {
                        name: 'revoked_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'device_info',
                        type: 'varchar',
                        length: '500',
                        isNullable: true,
                    },
                    {
                        name: 'ip_address',
                        type: 'varchar',
                        length: '45',
                        isNullable: true,
                    },
                    {
                        name: 'user_id',
                        type: 'varchar',
                        length: '36',
                        isNullable: false,
                    },
                ],
            }),
            true,
        );

        // Create index on token_hash for fast lookups
        await queryRunner.createIndex(
            'refresh_tokens',
            new TableIndex({
                name: 'IDX_refresh_tokens_token_hash',
                columnNames: ['token_hash'],
                isUnique: true,
            }),
        );

        // Create index on user_id for listing user's sessions
        await queryRunner.createIndex(
            'refresh_tokens',
            new TableIndex({
                name: 'IDX_refresh_tokens_user_id',
                columnNames: ['user_id'],
            }),
        );

        // Create foreign key to users table
        await queryRunner.createForeignKey(
            'refresh_tokens',
            new TableForeignKey({
                name: 'FK_refresh_tokens_user_id',
                columnNames: ['user_id'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropForeignKey(
            'refresh_tokens',
            'FK_refresh_tokens_user_id',
        );
        await queryRunner.dropIndex(
            'refresh_tokens',
            'IDX_refresh_tokens_user_id',
        );
        await queryRunner.dropIndex(
            'refresh_tokens',
            'IDX_refresh_tokens_token_hash',
        );
        await queryRunner.dropTable('refresh_tokens');
    }
}
