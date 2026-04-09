import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import appConfig from './config/app.config';

import { AuthModule } from './api/v1/auth/auth.module';
import { DocumentClassificationsModule } from './api/v1/document-classifications/document-classifications.module';
import { LawsuitsModule } from './api/v1/lawsuits/lawsuits.module';
import { DashboardModule } from './api/v1/dashboard/dashboard.module';
import { UpayaHukumModule } from './api/v1/upaya-hukum/upaya-hukum.module';
import { UsersModule } from './api/v1/users/users.module';
import { RecycleBinModule } from './api/v1/recycle-bin/recycle-bin.module';
import { PublicModule } from './api/v1/public/public.module';

@Module({
    imports: [
        // App Config
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig],
        }),

        // TypeORM
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                type: 'mysql',
                host: configService.get('db.host'),
                port: configService.get('db.port'),
                database: configService.get('db.name'),
                username: configService.get('db.user'),
                password: configService.get('db.password'),
                autoLoadEntities: true,
                synchronize: false,
            }),
            dataSourceFactory: async (options) => {
                try {
                    const dataSource = await new DataSource(
                        options,
                    ).initialize();
                    Logger.verbose(
                        '[TypeORM] Data Source has been initialized!',
                    );

                    return dataSource;
                } catch (error) {
                    Logger.error(
                        '[TypeORM] Error during Data Source initialization:',
                        error,
                    );
                }
            },
        }),

        // Module
        AuthModule,
        UsersModule,
        LawsuitsModule,
        DashboardModule,
        DocumentClassificationsModule,
        UpayaHukumModule,
        RecycleBinModule,
        PublicModule,
    ],
})
export class AppModule {}
