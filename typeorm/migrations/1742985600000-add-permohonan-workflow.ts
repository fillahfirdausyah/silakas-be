import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPermohonanWorkflow1742985600000 implements MigrationInterface {
    name = 'AddPermohonanWorkflow1742985600000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Step 1: Modify status enum to include Permohonan statuses
        // MySQL requires altering the column to modify enum values
        await queryRunner.query(
            `ALTER TABLE \`lawsuits\` MODIFY COLUMN \`status\` enum ('DRAFT', 'SUBMITTED_TO_GUGATAN', 'RECEIVED_BY_GUGATAN', 'SUBMITTED_TO_PERMOHONAN', 'RECEIVED_BY_PERMOHONAN', 'SUBMITTED_TO_HUKUM', 'RECEIVED_BY_HUKUM') NOT NULL DEFAULT 'DRAFT'`,
        );

        // Step 2: Add Permohonan workflow date columns
        await queryRunner.query(
            `ALTER TABLE \`lawsuits\` ADD COLUMN \`submitted_to_permohonan_at\` timestamp NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE \`lawsuits\` ADD COLUMN \`received_by_permohonan_at\` timestamp NULL`,
        );

        // Step 3: Add panmud_permohonan_id column with foreign key
        await queryRunner.query(
            `ALTER TABLE \`lawsuits\` ADD COLUMN \`panmud_permohonan_id\` varchar(36) NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE \`lawsuits\` ADD CONSTRAINT \`FK_lawsuits_panmud_permohonan_id\` FOREIGN KEY (\`panmud_permohonan_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Step 1: Drop foreign key and column for panmud_permohonan_id
        await queryRunner.query(
            `ALTER TABLE \`lawsuits\` DROP FOREIGN KEY \`FK_lawsuits_panmud_permohonan_id\``,
        );
        await queryRunner.query(
            `ALTER TABLE \`lawsuits\` DROP COLUMN \`panmud_permohonan_id\``,
        );

        // Step 2: Drop Permohonan workflow date columns
        await queryRunner.query(
            `ALTER TABLE \`lawsuits\` DROP COLUMN \`received_by_permohonan_at\``,
        );
        await queryRunner.query(
            `ALTER TABLE \`lawsuits\` DROP COLUMN \`submitted_to_permohonan_at\``,
        );

        // Step 3: Revert status enum to original values
        await queryRunner.query(
            `ALTER TABLE \`lawsuits\` MODIFY COLUMN \`status\` enum ('DRAFT', 'SUBMITTED_TO_GUGATAN', 'RECEIVED_BY_GUGATAN', 'SUBMITTED_TO_HUKUM', 'RECEIVED_BY_HUKUM') NOT NULL DEFAULT 'DRAFT'`,
        );
    }
}