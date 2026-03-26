import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1774556269102 implements MigrationInterface {
    name = 'Init1774556269102'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`lawsuits\` DROP FOREIGN KEY \`FK_lawsuits_panmud_permohonan_id\``);
        await queryRunner.query(`ALTER TABLE \`lawsuits\` ADD CONSTRAINT \`FK_76ded22f750138eab9dbf042ee6\` FOREIGN KEY (\`panmud_permohonan_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`lawsuits\` DROP FOREIGN KEY \`FK_76ded22f750138eab9dbf042ee6\``);
        await queryRunner.query(`ALTER TABLE \`lawsuits\` ADD CONSTRAINT \`FK_lawsuits_panmud_permohonan_id\` FOREIGN KEY (\`panmud_permohonan_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
