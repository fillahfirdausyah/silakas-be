import {
    MigrationInterface,
    QueryRunner,
    TableColumn,
} from 'typeorm';

export class AddTypeToLawsuits1742760000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'lawsuits',
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
        await queryRunner.dropColumn('lawsuits', 'type');
    }
}