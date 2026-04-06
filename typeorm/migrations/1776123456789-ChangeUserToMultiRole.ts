import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeUserToMultiRole1776123456789 implements MigrationInterface {
    name = 'ChangeUserToMultiRole1776123456789';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Step 1: Create junction table for user_roles
        await queryRunner.query(
            `CREATE TABLE \`user_roles\` (
                \`user_id\` varchar(36) NOT NULL,
                \`role_id\` varchar(36) NOT NULL,
                PRIMARY KEY (\`user_id\`, \`role_id\`),
                INDEX \`IDX_user_roles_user_id\` (\`user_id\`),
                INDEX \`IDX_user_roles_role_id\` (\`role_id\`)
            ) ENGINE=InnoDB`,
        );

        // Step 2: Add foreign key constraints
        await queryRunner.query(
            `ALTER TABLE \`user_roles\`
            ADD CONSTRAINT \`FK_user_roles_user_id\`
            FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`)
            ON DELETE CASCADE ON UPDATE CASCADE`,
        );

        await queryRunner.query(
            `ALTER TABLE \`user_roles\`
            ADD CONSTRAINT \`FK_user_roles_role_id\`
            FOREIGN KEY (\`role_id\`) REFERENCES \`roles\`(\`id\`)
            ON DELETE CASCADE ON UPDATE CASCADE`,
        );

        // Step 3: Copy existing role_id data to junction table
        await queryRunner.query(
            `INSERT INTO \`user_roles\` (\`user_id\`, \`role_id\`)
            SELECT \`id\`, \`role_id\` FROM \`users\` WHERE \`role_id\` IS NOT NULL`,
        );

        // Step 4: Drop foreign key constraint on users.role_id
        await queryRunner.query(
            `ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_a2cecd1a3531c0b041e29ba46e1\``,
        );

        // Step 5: Drop role_id column from users table
        await queryRunner.query(
            `ALTER TABLE \`users\` DROP COLUMN \`role_id\``,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Step 1: Add role_id column back to users
        await queryRunner.query(
            `ALTER TABLE \`users\` ADD COLUMN \`role_id\` varchar(36) NULL`,
        );

        // Step 2: Restore data from junction table (take first role as primary)
        await queryRunner.query(
            `UPDATE \`users\` u
            SET \`role_id\` = (
                SELECT \`role_id\` FROM \`user_roles\` ur
                WHERE ur.\`user_id\` = u.\`id\`
                LIMIT 1
            )`,
        );

        // Step 3: Re-add foreign key constraint
        await queryRunner.query(
            `ALTER TABLE \`users\`
            ADD CONSTRAINT \`FK_a2cecd1a3531c0b041e29ba46e1\`
            FOREIGN KEY (\`role_id\`) REFERENCES \`roles\`(\`id\`)
            ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );

        // Step 4: Drop foreign keys on junction table
        await queryRunner.query(
            `ALTER TABLE \`user_roles\` DROP FOREIGN KEY \`FK_user_roles_user_id\``,
        );
        await queryRunner.query(
            `ALTER TABLE \`user_roles\` DROP FOREIGN KEY \`FK_user_roles_role_id\``,
        );

        // Step 5: Drop junction table
        await queryRunner.query(`DROP TABLE \`user_roles\``);
    }
}
