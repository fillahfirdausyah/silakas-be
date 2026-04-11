import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropDocClassUniqueIndexesForSoftDelete1776700000000
    implements MigrationInterface
{
    name = 'DropDocClassUniqueIndexesForSoftDelete1776700000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP INDEX \`IDX_4129be7ed41eae5d43fd166368\` ON \`document_classifications\``,
        );
        await queryRunner.query(
            `DROP INDEX \`IDX_2817b1e9a0f7165ed0aaf7218d\` ON \`document_classifications\``,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE UNIQUE INDEX \`IDX_2817b1e9a0f7165ed0aaf7218d\` ON \`document_classifications\` (\`code\`)`,
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX \`IDX_4129be7ed41eae5d43fd166368\` ON \`document_classifications\` (\`name\`)`,
        );
    }
}
