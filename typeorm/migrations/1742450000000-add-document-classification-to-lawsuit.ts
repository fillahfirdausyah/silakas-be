import {
    MigrationInterface,
    QueryRunner,
    TableColumn,
    TableForeignKey,
} from 'typeorm';

export class AddDocumentClassificationToLawsuit1742450000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add document_classification_id column to lawsuits
        await queryRunner.addColumn(
            'lawsuits',
            new TableColumn({
                name: 'document_classification_id',
                type: 'varchar',
                length: '36',
                isNullable: true,
            }),
        );

        // Add foreign key constraint
        await queryRunner.createForeignKey(
            'lawsuits',
            new TableForeignKey({
                name: 'fk_lawsuit_document_classification',
                columnNames: ['document_classification_id'],
                referencedTableName: 'document_classifications',
                referencedColumnNames: ['id'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropForeignKey(
            'lawsuits',
            'fk_lawsuit_document_classification',
        );
        await queryRunner.dropColumn('lawsuits', 'document_classification_id');
    }
}
