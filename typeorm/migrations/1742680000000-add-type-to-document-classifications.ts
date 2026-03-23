import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTypeToDocumentClassifications1742680000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'document_classifications',
            new TableColumn({
                name: 'type',
                type: 'enum',
                enum: ['gugatan', 'permohonan'],
                default: "'gugatan'",
                isNullable: false,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('document_classifications', 'type');
    }
}
