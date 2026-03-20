import {
    MigrationInterface,
    QueryRunner,
    TableColumn,
    TableForeignKey,
} from 'typeorm';

export class AddJsIdLawsuit1773936605909 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'lawsuits',
            new TableColumn({
                name: 'js_id',
                type: 'varchar',
                length: '36',
                isNullable: true,
            }),
        );

        await queryRunner.createForeignKey(
            'lawsuits',
            new TableForeignKey({
                name: 'fk_lawsuit_js',
                columnNames: ['js_id'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropForeignKey('lawsuits', 'fk_lawsuit_js');
        await queryRunner.dropColumn('lawsuits', 'js_id');
    }
}
