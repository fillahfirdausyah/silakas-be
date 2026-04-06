import {
    CanActivate,
    ExecutionContext,
    HttpException,
    HttpStatus,
    Injectable,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
    private logger = new Logger(AuthGuard.name);
    constructor(
        private jwtService: JwtService,
        private reflector: Reflector,
        private configService: ConfigService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        const requiredPermissions =
            this.reflector.get<string[]>('permissions', context.getHandler()) ||
            [];
        const requiredRoles =
            this.reflector.get<string[]>('roles', context.getHandler()) || [];

        // Validate authorization bearer
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            throw new HttpException(
                {
                    message: 'Token tidak ditemukan.',
                },
                HttpStatus.UNAUTHORIZED,
            );
        }

        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get('jwt.accessSecret'),
            });

            request['userId'] = payload.id;
            request['roles'] = payload.roles;
            request['originalRoles'] = payload.originalRoles;
            request['isImpersonating'] = payload.isImpersonating;
        } catch (error) {
            this.logger.error(`JWT verification failed: ${error}`);
            throw new HttpException(
                {
                    message: 'Tidak terotorisasi.',
                },
                HttpStatus.UNAUTHORIZED,
            );
        }

        // Validate permission
        if (requiredPermissions.length > 0) {
            const isPermissionMatch = requiredPermissions.some((permission) =>
                (request['permissions'] ?? []).includes(permission),
            );

            if (!isPermissionMatch) {
                throw new HttpException(
                    {
                        message: 'Akses dilarang, Anda tidak memiliki izin',
                    },
                    HttpStatus.FORBIDDEN,
                );
            }
        }

        // Use originalRoles for authorization if impersonating, otherwise use current roles
        const effectiveRoles =
            request['isImpersonating'] && request['originalRoles']
                ? request['originalRoles']
                : (request['roles'] ?? []);

        // Check if any of the user's roles matches the required roles
        // Super-admin always has access
        if (
            requiredRoles.length > 0 &&
            !effectiveRoles.some((role) => requiredRoles.includes(role)) &&
            !effectiveRoles.includes('super-admin')
        ) {
            throw new HttpException(
                {
                    message: 'Akses dilarang, role tidak valid',
                },
                HttpStatus.FORBIDDEN,
            );
        }

        return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
