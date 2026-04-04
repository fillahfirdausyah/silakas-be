import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBandingKasasiDates1775321304186 implements MigrationInterface {
    name = 'AddBandingKasasiDates1775321304186';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add Banding date columns
        await queryRunner.query(`
            ALTER TABLE \`upaya_hukum\`
            ADD COLUMN \`putus_date_banding\` DATE NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`upaya_hukum\`
            ADD COLUMN \`pbt_date_banding\` DATE NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`upaya_hukum\`
            ADD COLUMN \`bht_date_banding\` DATE NULL
        `);

        // Add Kasasi date columns
        await queryRunner.query(`
            ALTER TABLE \`upaya_hukum\`
            ADD COLUMN \`putus_date_kasasi\` DATE NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`upaya_hukum\`
            ADD COLUMN \`pbt_date_kasasi\` DATE NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`upaya_hukum\`
            ADD COLUMN \`bht_date_kasasi\` DATE NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove Kasasi date columns
        await queryRunner.query(`
            ALTER TABLE \`upaya_hukum\` DROP COLUMN \`bht_date_kasasi\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`upaya_hukum\` DROP COLUMN \`pbt_date_kasasi\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`upaya_hukum\` DROP COLUMN \`putus_date_kasasi\`
        `);

        // Remove Banding date columns
        await queryRunner.query(`
            ALTER TABLE \`upaya_hukum\` DROP COLUMN \`bht_date_banding\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`upaya_hukum\` DROP COLUMN \`pbt_date_banding\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`upaya_hukum\` DROP COLUMN \`putus_date_banding\`
        `);
    }
}
