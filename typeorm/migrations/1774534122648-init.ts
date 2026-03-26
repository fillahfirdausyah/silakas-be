import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1774534122648 implements MigrationInterface {
    name = 'Init1774534122648';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE \`roles\` (\`id\` varchar(36) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, \`name\` varchar(255) NOT NULL, \`slug\` varchar(255) NOT NULL, \`description\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_648e3f5447f725579d7d4ffdfb\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        );
        await queryRunner.query(
            `CREATE TABLE \`case_types\` (\`id\` varchar(36) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, \`name\` varchar(255) NOT NULL, \`description\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_827f04c63b631bdb664189fc43\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        );
        await queryRunner.query(
            `CREATE TABLE \`documents\` (\`id\` varchar(36) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, \`case_number\` varchar(255) NOT NULL, \`position_at\` enum ('Panitera Pengganti', 'Panmud Gugatan', 'Panmud Hukum') NOT NULL, \`information\` varchar(255) NULL, \`pbt_date\` datetime NOT NULL, \`bht_date\` datetime NOT NULL, \`pledge_date\` datetime NULL, \`status\` varchar(255) NOT NULL, \`case_type_id\` varchar(36) NULL, \`pp_id\` varchar(36) NULL, \`gugatan_id\` varchar(36) NULL, \`hukum_id\` varchar(36) NULL, UNIQUE INDEX \`IDX_d61f26f83051a93bd479b936a5\` (\`case_number\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        );
        await queryRunner.query(
            `CREATE TABLE \`document_classifications\` (\`id\` varchar(36) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, \`name\` varchar(255) NOT NULL, \`code\` varchar(50) NOT NULL, \`type\` enum ('gugatan', 'permohonan') NOT NULL DEFAULT 'gugatan', \`description\` varchar(500) NULL, \`is_active\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`IDX_4129be7ed41eae5d43fd166368\` (\`name\`), UNIQUE INDEX \`IDX_2817b1e9a0f7165ed0aaf7218d\` (\`code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        );
        await queryRunner.query(
            `CREATE TABLE \`upaya_hukum\` (\`id\` varchar(36) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, \`lawsuit_id\` varchar(255) NOT NULL, \`type\` enum ('BANDING', 'KASASI') NOT NULL DEFAULT 'BANDING', \`tanggal_daftar\` date NOT NULL, \`tanggal_daftar_banding\` date NOT NULL, \`tanggal_daftar_kasasi\` date NULL, UNIQUE INDEX \`IDX_44d9db416b8c042a88c6d78cef\` (\`lawsuit_id\`), UNIQUE INDEX \`REL_44d9db416b8c042a88c6d78cef\` (\`lawsuit_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        );
        await queryRunner.query(
            `CREATE TABLE \`lawsuits\` (\`id\` varchar(36) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, \`case_number\` varchar(255) NOT NULL, \`decision_date\` date NOT NULL, \`classification\` varchar(255) NULL, \`type\` enum ('gugatan', 'permohonan') NOT NULL DEFAULT 'gugatan', \`status\` enum ('DRAFT', 'SUBMITTED_TO_GUGATAN', 'RECEIVED_BY_GUGATAN', 'SUBMITTED_TO_HUKUM', 'RECEIVED_BY_HUKUM') NOT NULL DEFAULT 'DRAFT', \`submitted_to_gugatan_at\` timestamp NULL, \`received_by_gugatan_at\` timestamp NULL, \`pbt_date\` date NULL, \`bht_date\` date NULL, \`ikrar_date\` date NULL, \`submitted_to_hukum_at\` timestamp NULL, \`received_by_hukum_at\` timestamp NULL, \`description\` varchar(255) NULL, \`document_classification_id\` varchar(36) NULL, \`pp_id\` varchar(36) NULL, \`panmud_gugatan_id\` varchar(36) NULL, \`panmud_hukum_id\` varchar(36) NULL, \`js_id\` varchar(36) NULL, UNIQUE INDEX \`IDX_929a8ff414f886635b8811c099\` (\`case_number\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        );
        await queryRunner.query(
            `CREATE TABLE \`users\` (\`id\` varchar(36) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, \`fullName\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`role_id\` varchar(36) NULL, UNIQUE INDEX \`IDX_4b2bf18167e94dce386d714c67\` (\`fullName\`), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        );
        await queryRunner.query(
            `CREATE TABLE \`refresh_tokens\` (\`id\` varchar(36) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, \`token_hash\` varchar(255) NOT NULL, \`expires_at\` timestamp NOT NULL, \`revoked_at\` timestamp NULL, \`device_info\` varchar(500) NULL, \`ip_address\` varchar(45) NULL, \`user_id\` varchar(255) NOT NULL, INDEX \`IDX_a7838d2ba25be1342091b6695f\` (\`token_hash\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        );
        await queryRunner.query(
            `CREATE TABLE \`impersonation_audit_logs\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(255) NOT NULL, \`action\` varchar(50) NOT NULL, \`original_role\` varchar(255) NULL, \`impersonated_role\` varchar(255) NULL, \`ip_address\` varchar(45) NULL, \`device_info\` varchar(500) NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_de6b7e93a521eaae37c545d913\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
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
            `ALTER TABLE \`upaya_hukum\` ADD CONSTRAINT \`FK_44d9db416b8c042a88c6d78cef7\` FOREIGN KEY (\`lawsuit_id\`) REFERENCES \`lawsuits\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE \`lawsuits\` ADD CONSTRAINT \`FK_c18b711587ca362aeeaa4346cce\` FOREIGN KEY (\`document_classification_id\`) REFERENCES \`document_classifications\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
            `ALTER TABLE \`lawsuits\` ADD CONSTRAINT \`FK_7ff272b1abcc2a850c62327738c\` FOREIGN KEY (\`js_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE \`users\` ADD CONSTRAINT \`FK_a2cecd1a3531c0b041e29ba46e1\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE \`refresh_tokens\` ADD CONSTRAINT \`FK_3ddc983c5f7bcf132fd8732c3f4\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`refresh_tokens\` DROP FOREIGN KEY \`FK_3ddc983c5f7bcf132fd8732c3f4\``,
        );
        await queryRunner.query(
            `ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_a2cecd1a3531c0b041e29ba46e1\``,
        );
        await queryRunner.query(
            `ALTER TABLE \`lawsuits\` DROP FOREIGN KEY \`FK_7ff272b1abcc2a850c62327738c\``,
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
            `ALTER TABLE \`lawsuits\` DROP FOREIGN KEY \`FK_c18b711587ca362aeeaa4346cce\``,
        );
        await queryRunner.query(
            `ALTER TABLE \`upaya_hukum\` DROP FOREIGN KEY \`FK_44d9db416b8c042a88c6d78cef7\``,
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
            `DROP INDEX \`IDX_de6b7e93a521eaae37c545d913\` ON \`impersonation_audit_logs\``,
        );
        await queryRunner.query(`DROP TABLE \`impersonation_audit_logs\``);
        await queryRunner.query(
            `DROP INDEX \`IDX_a7838d2ba25be1342091b6695f\` ON \`refresh_tokens\``,
        );
        await queryRunner.query(`DROP TABLE \`refresh_tokens\``);
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
            `DROP INDEX \`REL_44d9db416b8c042a88c6d78cef\` ON \`upaya_hukum\``,
        );
        await queryRunner.query(
            `DROP INDEX \`IDX_44d9db416b8c042a88c6d78cef\` ON \`upaya_hukum\``,
        );
        await queryRunner.query(`DROP TABLE \`upaya_hukum\``);
        await queryRunner.query(
            `DROP INDEX \`IDX_2817b1e9a0f7165ed0aaf7218d\` ON \`document_classifications\``,
        );
        await queryRunner.query(
            `DROP INDEX \`IDX_4129be7ed41eae5d43fd166368\` ON \`document_classifications\``,
        );
        await queryRunner.query(`DROP TABLE \`document_classifications\``);
        await queryRunner.query(
            `DROP INDEX \`IDX_d61f26f83051a93bd479b936a5\` ON \`documents\``,
        );
        await queryRunner.query(`DROP TABLE \`documents\``);
        await queryRunner.query(
            `DROP INDEX \`IDX_827f04c63b631bdb664189fc43\` ON \`case_types\``,
        );
        await queryRunner.query(`DROP TABLE \`case_types\``);
        await queryRunner.query(
            `DROP INDEX \`IDX_648e3f5447f725579d7d4ffdfb\` ON \`roles\``,
        );
        await queryRunner.query(`DROP TABLE \`roles\``);
    }
}
