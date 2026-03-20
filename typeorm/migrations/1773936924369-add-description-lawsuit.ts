import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDescriptionLawsuit1773936924369 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'lawsuits',
            new TableColumn({
                name: 'description',
                type: 'varchar',
                length: '255',
                isNullable: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('lawsuits', 'description');
    }
}
