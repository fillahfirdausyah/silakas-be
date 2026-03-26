import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
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
        const roles = [
            {
                id: crypto.randomUUID(),
                name: 'Super Admin',
                slug: 'super-admin',
                description: 'Can manage everything',
            },
            {
                id: crypto.randomUUID(),
                name: 'Panitera Pengganti',
                slug: 'panitera-pengganti',
                description: 'Input berkas',
            },
            {
                id: crypto.randomUUID(),
                name: 'Panmud Gugatan',
                slug: 'panmud-gugatan',
                description: 'Input BHT',
            },
            {
                id: crypto.randomUUID(),
                name: 'Panmud Hukum',
                slug: 'panmud-hukum',
                description: 'Input BPS',
            },
            {
                id: crypto.randomUUID(),
                name: 'Panmud Permohonan',
                slug: 'panmud-permohonan',
                description: 'Input Permohonan',
            },
            {
                id: crypto.randomUUID(),
                name: 'Juru Sita',
                slug: 'juru-sita',
                description: 'Handle Juru Sita',
            },
        ];

        for (const role of roles) {
            await queryRunner.query(
                `INSERT INTO roles (id, name, slug, description, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())`,
                [role.id, role.name, role.slug, role.description],
            );
        }

        // Seed user
        const superAdminRole = roles.find((r) => r.slug === 'super-admin');
        const superAdminId = crypto.randomUUID();

        await queryRunner.query(
            `INSERT INTO users (id, fullName, email, password, role_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
            [
                superAdminId,
                superAdminName,
                superAdminEmail,
                hashedSuperAdminPassword,
                superAdminRole.id,
            ],
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
