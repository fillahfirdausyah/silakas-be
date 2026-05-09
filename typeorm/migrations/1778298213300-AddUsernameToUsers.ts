import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUsernameToUsers1778298213300 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`users\` ADD COLUMN \`username\` VARCHAR(255) NULL UNIQUE`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`users\` DROP COLUMN \`username\``,
        );
    }
}
