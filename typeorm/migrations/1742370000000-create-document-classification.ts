import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateDocumentClassification1742370000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'document_classifications',
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
                        name: 'name',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'code',
                        type: 'varchar',
                        length: '50',
                        isNullable: false,
                    },
                    {
                        name: 'description',
                        type: 'varchar',
                        length: '500',
                        isNullable: true,
                    },
                    {
                        name: 'is_active',
                        type: 'boolean',
                        default: true,
                    },
                ],
            }),
            true,
        );

        await queryRunner.query(
            `CREATE UNIQUE INDEX \`IDX_document_classifications_name\` ON \`document_classifications\` (\`name\`)`,
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX \`IDX_document_classifications_code\` ON \`document_classifications\` (\`code\`)`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP INDEX \`IDX_document_classifications_code\` ON \`document_classifications\``,
        );
        await queryRunner.query(
            `DROP INDEX \`IDX_document_classifications_name\` ON \`document_classifications\``,
        );
        await queryRunner.dropTable('document_classifications');
    }
}
