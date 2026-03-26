import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableForeignKey,
    TableIndex,
} from 'typeorm';

export class CreateUpayaHukum1743000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'upaya_hukum',
                columns: [
                    {
                        name: 'id',
                        type: 'varchar',
                        length: '36',
                        isPrimary: true,
                        primaryKeyConstraintName: 'pk_uuid_id',
                    },
                    {
                        name: 'lawsuit_id',
                        type: 'varchar',
                        length: '36',
                        isUnique: true,
                        isNullable: false,
                    },
                    {
                        name: 'type',
                        type: 'enum',
                        enum: ['BANDING', 'KASASI'],
                        default: "'BANDING'",
                        isNullable: false,
                    },
                    {
                        name: 'tanggal_daftar',
                        type: 'date',
                        isNullable: false,
                    },
                    {
                        name: 'tanggal_daftar_banding',
                        type: 'date',
                        isNullable: false,
                    },
                    {
                        name: 'tanggal_daftar_kasasi',
                        type: 'date',
                        isNullable: true,
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
                ],
            }),
            true,
        );

        // Add foreign key
        await queryRunner.createForeignKey(
            'upaya_hukum',
            new TableForeignKey({
                columnNames: ['lawsuit_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'lawsuits',
                onDelete: 'CASCADE',
                name: 'fk_upaya_hukum_lawsuit_id',
            }),
        );

        // Add index on type column
        await queryRunner.createIndex(
            'upaya_hukum',
            new TableIndex({
                name: 'idx_upaya_hukum_type',
                columnNames: ['type'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropForeignKey(
            'upaya_hukum',
            'fk_upaya_hukum_lawsuit_id',
        );
        await queryRunner.dropIndex('upaya_hukum', 'idx_upaya_hukum_type');
        await queryRunner.dropTable('upaya_hukum');
    }
}
