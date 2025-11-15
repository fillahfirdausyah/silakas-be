import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

import { dataSource } from './config';

dotenv.config();

async function seed() {
    // Initiate super admin
    const superAdminName = process.env.SUPERADMIN_NAME;
    const superAdminEmail = process.env.SUPERADMIN_EMAIL;
    const superAdminPassword = process.env.SUPERADMIN_PASSWORD;

    const salt = await bcrypt.genSalt();
    const hashedSuperAdminPassword = await bcrypt.hash(
        superAdminPassword,
        salt,
    );

    // Initiate datasource
    await dataSource.initialize();

    // Setup transaction
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        // Seed role
        await queryRunner.query(
            `
            INSERT INTO
                roles (id, name, slug, description, created_at, updated_at)
            VALUES
                (1, 'Super Admin', 'super-admin', 'Can manage everything', NOW(), NOW()),
                (2, 'Panitera Pengganti', 'pantera-pengganti', 'Input berkas', NOW(), NOW()),
                (3, 'Panmud Gugatan', 'panmud-gugatan', 'Input BHT', NOW(), NOW()),
                (4, 'Panmud Hukum', 'panmud-hukum', 'Input BPS', NOW(), NOW());
            `,
        );

        // Seed user
        await queryRunner.query(
            `
            INSERT INTO
                users (id, fullName, email, password, created_at, updated_at)
            VALUES
                (1, '${superAdminName}', '${superAdminEmail}', '${hashedSuperAdminPassword}', NOW(), NOW());
            `,
        );

        await queryRunner.query(
            `
            UPDATE
                users
            SET
                role_id = (
                    SELECT id FROM roles WHERE slug = 'super-admin'
                ),
                updated_at = NOW()
            WHERE
                id = 1;
            `,
        );

        await queryRunner.commitTransaction();
        console.log('Seeding completed');
    } catch (error) {
        console.error('Error during seeding:', error);
        await queryRunner.rollbackTransaction();
    } finally {
        await queryRunner.release();
        await dataSource.destroy();
    }
}

seed();
