import {
    HttpException,
    HttpStatus,
    ValidationPipe,
    VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationError } from 'class-validator';

async function bootstrap() {
    // Initiate App
    const app = await NestFactory.create(AppModule);
    const configService = app.get<ConfigService>(ConfigService);

    // Enable cors
    app.enableCors();

    // Enable global validation
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            exceptionFactory: (validationErrors) => {
                const formatErrors = (
                    errors: ValidationError[],
                    parentPath = '',
                ): any[] => {
                    return errors.flatMap((error) => {
                        const field = parentPath
                            ? `${parentPath}.${error.property}`
                            : error.property;
                        const message = error.constraints
                            ? Object.values(error.constraints)[0]
                            : null;

                        if (error.children && error.children.length > 0) {
                            return formatErrors(error.children, field);
                        }

                        return { field, message };
                    });
                };

                const errors = formatErrors(validationErrors);

                return new HttpException(
                    {
                        message: 'One or more errors occurred.',
                        error: errors,
                    },
                    HttpStatus.UNPROCESSABLE_ENTITY,
                );
            },
        }),
    );

    // Api Versioning
    app.enableVersioning({
        type: VersioningType.URI,
    });

    // Swagger OpenAPI
    const swaggerConfig = new DocumentBuilder()
        .setTitle('Movora Backend API')
        .setDescription('Movora Health Backend API')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                name: 'Authorization',
                description: 'Enter JWT access token',
                in: 'header',
            },
            'BearerAuth',
        )
        .build();
    const documentFactory = () =>
        SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, documentFactory, {
        swaggerOptions: {
            persistAuthorization: true,
        },
    });

    await app.listen(configService.get('PORT'));
}
bootstrap();
