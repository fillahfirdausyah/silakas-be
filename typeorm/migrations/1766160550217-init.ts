import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1766160550217 implements MigrationInterface {
    name = 'Init1766160550217';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE \`case_types\` (\`id\` varchar(36) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, \`name\` varchar(255) NOT NULL, \`description\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_827f04c63b631bdb664189fc43\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        );
        await queryRunner.query(
            `CREATE TABLE \`documents\` (\`id\` varchar(36) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, \`case_number\` varchar(255) NOT NULL, \`position_at\` enum ('Panitera Pengganti', 'Panmud Gugatan', 'Panmud Hukum') NOT NULL, \`information\` varchar(255) NULL, \`pbt_date\` datetime NOT NULL, \`bht_date\` datetime NOT NULL, \`pledge_date\` datetime NULL, \`status\` varchar(255) NOT NULL, \`case_type_id\` varchar(36) NULL, \`pp_id\` varchar(36) NULL, \`gugatan_id\` varchar(36) NULL, \`hukum_id\` varchar(36) NULL, UNIQUE INDEX \`IDX_d61f26f83051a93bd479b936a5\` (\`case_number\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        );
        await queryRunner.query(
            `CREATE TABLE \`lawsuits\` (\`id\` varchar(36) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, \`case_number\` varchar(255) NOT NULL, \`decision_date\` date NOT NULL, \`classification\` varchar(255) NOT NULL, \`status\` enum ('DRAFT', 'SUBMITTED_TO_GUGATAN', 'RECEIVED_BY_GUGATAN', 'SUBMITTED_TO_HUKUM', 'RECEIVED_BY_HUKUM') NOT NULL DEFAULT 'DRAFT', \`submitted_to_gugatan_at\` timestamp NULL, \`received_by_gugatan_at\` timestamp NULL, \`pbt_date\` date NULL, \`bht_date\` date NULL, \`ikrar_date\` date NULL, \`submitted_to_hukum_at\` timestamp NULL, \`received_by_hukum_at\` timestamp NULL, \`pp_id\` varchar(36) NULL, \`panmud_gugatan_id\` varchar(36) NULL, \`panmud_hukum_id\` varchar(36) NULL, UNIQUE INDEX \`IDX_929a8ff414f886635b8811c099\` (\`case_number\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        );
        await queryRunner.query(
            `CREATE TABLE \`users\` (\`id\` varchar(36) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, \`fullName\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`role_id\` varchar(36) NULL, UNIQUE INDEX \`IDX_4b2bf18167e94dce386d714c67\` (\`fullName\`), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        );
        await queryRunner.query(
            `CREATE TABLE \`roles\` (\`id\` varchar(36) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, \`name\` varchar(255) NOT NULL, \`slug\` varchar(255) NOT NULL, \`description\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_648e3f5447f725579d7d4ffdfb\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        );
        await queryRunner.query(
            `ALTER TABLE \`documents\` ADD CONSTRAINT \`FK_0fad98d2cba28751a8696779bb6\` FOREIGN KEY (\`case_type_id\`) REFERENCES \`case_types\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE \`documents\` ADD CONSTRAINT \`FK_a7d2b66f00b863aaae611c1d4bc\` FOREIGN KEY (\`pp_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE \`documents\` ADD CONSTRAINT \`FK_747178addb50eb2a134f98a6775\` FOREIGN KEY (\`gugatan_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE \`documents\` ADD CONSTRAINT \`FK_add13b1a7bf2bfae43e178137a0\` FOREIGN KEY (\`hukum_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE \`lawsuits\` ADD CONSTRAINT \`FK_52cfb2cf4c92d2310574be2edfe\` FOREIGN KEY (\`pp_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE \`lawsuits\` ADD CONSTRAINT \`FK_14fadb399969ad69f65b733d5ec\` FOREIGN KEY (\`panmud_gugatan_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE \`lawsuits\` ADD CONSTRAINT \`FK_3a2bdbf0b018c47e4f54c38c124\` FOREIGN KEY (\`panmud_hukum_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE \`users\` ADD CONSTRAINT \`FK_a2cecd1a3531c0b041e29ba46e1\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_a2cecd1a3531c0b041e29ba46e1\``,
        );
        await queryRunner.query(
            `ALTER TABLE \`lawsuits\` DROP FOREIGN KEY \`FK_3a2bdbf0b018c47e4f54c38c124\``,
        );
        await queryRunner.query(
            `ALTER TABLE \`lawsuits\` DROP FOREIGN KEY \`FK_14fadb399969ad69f65b733d5ec\``,
        );
        await queryRunner.query(
            `ALTER TABLE \`lawsuits\` DROP FOREIGN KEY \`FK_52cfb2cf4c92d2310574be2edfe\``,
        );
        await queryRunner.query(
            `ALTER TABLE \`documents\` DROP FOREIGN KEY \`FK_add13b1a7bf2bfae43e178137a0\``,
        );
        await queryRunner.query(
            `ALTER TABLE \`documents\` DROP FOREIGN KEY \`FK_747178addb50eb2a134f98a6775\``,
        );
        await queryRunner.query(
            `ALTER TABLE \`documents\` DROP FOREIGN KEY \`FK_a7d2b66f00b863aaae611c1d4bc\``,
        );
        await queryRunner.query(
            `ALTER TABLE \`documents\` DROP FOREIGN KEY \`FK_0fad98d2cba28751a8696779bb6\``,
        );
        await queryRunner.query(
            `DROP INDEX \`IDX_648e3f5447f725579d7d4ffdfb\` ON \`roles\``,
        );
        await queryRunner.query(`DROP TABLE \`roles\``);
        await queryRunner.query(
            `DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``,
        );
        await queryRunner.query(
            `DROP INDEX \`IDX_4b2bf18167e94dce386d714c67\` ON \`users\``,
        );
        await queryRunner.query(`DROP TABLE \`users\``);
        await queryRunner.query(
            `DROP INDEX \`IDX_929a8ff414f886635b8811c099\` ON \`lawsuits\``,
        );
        await queryRunner.query(`DROP TABLE \`lawsuits\``);
        await queryRunner.query(
            `DROP INDEX \`IDX_d61f26f83051a93bd479b936a5\` ON \`documents\``,
        );
        await queryRunner.query(`DROP TABLE \`documents\``);
        await queryRunner.query(
            `DROP INDEX \`IDX_827f04c63b631bdb664189fc43\` ON \`case_types\``,
        );
        await queryRunner.query(`DROP TABLE \`case_types\``);
    }
}
