import {
    ConflictException,
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { StringValue } from 'ms';
import { handleServiceError } from 'src/shared/utils/handler-service-error.util';
import { AuthRepository } from '../repositories/auth.repository';
import { ImpersonationAuditService } from '../../../../shared/services/impersonation-audit.service';

@Injectable()
export class AuthService {
    private logger = new Logger(AuthService.name);
    constructor(
        private configService: ConfigService,
        private jwtService: JwtService,
        private authRepository: AuthRepository,
        private auditService: ImpersonationAuditService,
    ) {}

    public async createUser(payload: {
        email: string;
        password: string;
        fullName: string;
    }) {
        try {
            const existingUser = await this.authRepository.findByEmail(
                payload.email,
            );
            if (existingUser) throw new ConflictException();

            const hashedPassword = await this.hashPassword(payload.password);

            const createdUser = await this.authRepository.createUser({
                email: payload.email,
                password: hashedPassword,
                fullName: payload.fullName,
            });

            return {
                payload: {
                    id: createdUser.id,
                    email: createdUser.email,
                    fullName: createdUser.fullName,
                    createdAt: createdUser.createdAt,
                },
            };
        } catch (error) {
            this.logger.error(error.stack || error);
            handleServiceError(error);
        }
    }

    public async login(payload: {
        email: string;
        password: string;
        rememberMe?: boolean;
        deviceInfo?: string;
        ipAddress?: string;
    }) {
        try {
            const user = await this.authRepository.findByEmail(payload.email, [
                'roles',
            ]);

            if (!user) {
                throw new UnauthorizedException('Kredensial tidak valid.');
            }

            const isPasswordValid = await this.comparePassword(
                payload.password,
                user.password,
            );

            if (!isPasswordValid) {
                throw new UnauthorizedException('Kredensial tidak valid.');
            }

            const roleSlugs = user.roles?.map((r) => r.slug) ?? [];

            const tokens = await this.generateTokens(
                {
                    id: user.id,
                    name: user.fullName,
                    email: user.email,
                    roles: roleSlugs,
                },
                payload.rememberMe ?? false,
            );

            // Hash the refresh token before storing
            const refreshTokenHash = this.hashToken(tokens.refreshToken);

            // Calculate expiration date based on rememberMe
            const refreshExpiration = payload.rememberMe
                ? this.configService.get<string>('jwt.refreshExpirationLong')
                : this.configService.get<string>('jwt.refreshExpirationShort');

            const expiresAt = this.calculateExpirationDate(refreshExpiration);

            // Store the refresh token in database
            await this.authRepository.saveRefreshToken({
                userId: user.id,
                tokenHash: refreshTokenHash,
                expiresAt,
                deviceInfo: payload.deviceInfo,
                ipAddress: payload.ipAddress,
            });

            return {
                payload: {
                    user: {
                        id: user.id,
                        email: user.email,
                        fullName: user.fullName,
                        authority: roleSlugs,
                    },
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                },
            };
        } catch (error) {
            this.logger.error(error.stack || error);
            handleServiceError(error);
        }
    }

    public async refreshToken(refreshToken: string) {
        try {
            // Verify the refresh token
            const payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.configService.get<string>('jwt.refreshSecret'),
            });

            // Hash the token and look it up in the database
            const tokenHash = this.hashToken(refreshToken);
            const storedToken =
                await this.authRepository.findRefreshTokenByHash(tokenHash);

            if (!storedToken) {
                throw new UnauthorizedException('Token tidak valid.');
            }

            if (storedToken.expiresAt < new Date()) {
                throw new UnauthorizedException('Token sudah kadaluarsa.');
            }

            // Revoke the old refresh token (rotation)
            await this.authRepository.revokeRefreshToken(tokenHash);

            // Generate new tokens - preserve the rememberMe preference by using long expiration
            const roleSlugs = storedToken.user.roles?.map((r) => r.slug) ?? [];
            const newTokens = await this.generateTokens(
                {
                    id: storedToken.user.id,
                    name: storedToken.user.fullName,
                    email: storedToken.user.email,
                    roles: roleSlugs,
                },
                true, // Use long expiration for refreshed tokens
            );

            // Store the new refresh token
            const newTokenHash = this.hashToken(newTokens.refreshToken);
            const refreshExpiration = this.configService.get<string>(
                'jwt.refreshExpirationLong',
            );
            const expiresAt = this.calculateExpirationDate(refreshExpiration);

            await this.authRepository.saveRefreshToken({
                userId: storedToken.user.id,
                tokenHash: newTokenHash,
                expiresAt,
            });

            return {
                payload: {
                    accessToken: newTokens.accessToken,
                    refreshToken: newTokens.refreshToken,
                },
            };
        } catch (error) {
            this.logger.error(error.stack || error);
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw new UnauthorizedException('Token tidak valid.');
        }
    }

    public async logout(refreshToken: string) {
        try {
            const tokenHash = this.hashToken(refreshToken);
            await this.authRepository.revokeRefreshToken(tokenHash);
        } catch (error) {
            this.logger.error(error.stack || error);
            // Don't throw error on logout - just log it
        }
    }

    private async hashPassword(rawPassword: string) {
        try {
            const salt = await bcrypt.genSalt(10);

            return bcrypt.hash(rawPassword, salt);
        } catch (error) {
            throw Error(error);
        }
    }

    private async comparePassword(rawPassword: string, hash: string) {
        try {
            return bcrypt.compare(rawPassword, hash);
        } catch (error) {
            throw Error(error);
        }
    }

    private hashToken(token: string): string {
        return crypto.createHash('sha256').update(token).digest('hex');
    }

    private calculateExpirationDate(expiration: string): Date {
        const expiresAt = new Date();
        const match = expiration.match(/^(\d+)([mhd])$/);

        if (!match) {
            // Default to 7 days if parsing fails
            expiresAt.setDate(expiresAt.getDate() + 7);
            return expiresAt;
        }

        const value = parseInt(match[1], 10);
        const unit = match[2];

        switch (unit) {
            case 'm':
                expiresAt.setMinutes(expiresAt.getMinutes() + value);
                break;
            case 'h':
                expiresAt.setHours(expiresAt.getHours() + value);
                break;
            case 'd':
                expiresAt.setDate(expiresAt.getDate() + value);
                break;
        }

        return expiresAt;
    }

    private async generateTokens(
        user: {
            id: string;
            email: string;
            name: string;
            roles: string[];
            originalRoles?: string[];
            isImpersonating?: boolean;
        },
        rememberMe: boolean,
    ) {
        try {
            const jwtPayload: {
                id: string;
                email: string;
                name: string;
                roles: string[];
                originalRoles?: string[];
                isImpersonating?: boolean;
            } = {
                id: user.id,
                email: user.email,
                name: user.name,
                roles: user.roles,
            };

            // Add impersonation data if present
            if (user.isImpersonating && user.originalRoles) {
                jwtPayload.originalRoles = user.originalRoles;
                jwtPayload.isImpersonating = true;
            }

            const accessExp =
                (rememberMe
                    ? this.configService.get<string>('jwt.accessExpirationLong')
                    : this.configService.get<string>(
                          'jwt.accessExpirationShort',
                      )) || '15m';
            const refreshExp =
                (rememberMe
                    ? this.configService.get<string>(
                          'jwt.refreshExpirationLong',
                      )
                    : this.configService.get<string>(
                          'jwt.refreshExpirationShort',
                      )) || '1h';

            const [accessToken, refreshToken] = await Promise.all([
                this.jwtService.signAsync(jwtPayload, {
                    secret:
                        this.configService.get<string>('jwt.accessSecret') ||
                        this.configService.get<string>('jwtSecret'),
                    expiresIn: accessExp as StringValue,
                }),
                this.jwtService.signAsync(jwtPayload, {
                    secret:
                        this.configService.get<string>('jwt.refreshSecret') ||
                        this.configService.get<string>('jwtSecret'),
                    expiresIn: refreshExp as StringValue,
                }),
            ]);

            return { accessToken, refreshToken };
        } catch (error) {
            throw Error(error);
        }
    }

    public async impersonateRole(payload: {
        userId: string;
        targetRoleSlug: string;
        ipAddress?: string;
        deviceInfo?: string;
    }) {
        try {
            // Get the user with their current roles
            const user = await this.authRepository.findUserWithRoles(
                payload.userId,
            );

            if (!user) {
                throw new UnauthorizedException('User tidak ditemukan.');
            }

            // Verify user has super-admin role
            const userRoleSlugs = user.roles?.map((r) => r.slug) ?? [];
            if (!userRoleSlugs.includes('super-admin')) {
                throw new UnauthorizedException(
                    'Hanya super admin yang dapat melakukan impersonasi.',
                );
            }

            // Find the target role
            const targetRole = await this.authRepository.findRoleBySlug(
                payload.targetRoleSlug,
            );

            if (!targetRole) {
                throw new NotFoundException('Role tidak ditemukan.');
            }

            // Prevent impersonating super-admin (optional - can be removed if needed)
            if (targetRole.slug === 'super-admin') {
                throw new ForbiddenException(
                    'Tidak dapat melakukan impersonasi ke role super-admin.',
                );
            }

            // Generate tokens with impersonated role
            const tokens = await this.generateTokens(
                {
                    id: user.id,
                    email: user.email,
                    name: user.fullName,
                    roles: [targetRole.slug], // The impersonated role
                    originalRoles: userRoleSlugs, // Store original roles
                    isImpersonating: true,
                },
                true, // Use long expiration for impersonation sessions
            );

            // Hash and store the new refresh token
            const refreshTokenHash = this.hashToken(tokens.refreshToken);
            const refreshExpiration = this.configService.get<string>(
                'jwt.refreshExpirationLong',
            );
            const expiresAt = this.calculateExpirationDate(refreshExpiration);

            // Revoke existing tokens for this user (optional - ensures only one impersonation session)
            await this.authRepository.revokeAllUserTokens(user.id);

            await this.authRepository.saveRefreshToken({
                userId: user.id,
                tokenHash: refreshTokenHash,
                expiresAt,
                deviceInfo: payload.deviceInfo,
                ipAddress: payload.ipAddress,
            });

            // Log the impersonation event
            await this.auditService.logImpersonationStart({
                userId: user.id,
                originalRole: userRoleSlugs.join(','),
                impersonatedRole: targetRole.slug,
                ipAddress: payload.ipAddress,
                deviceInfo: payload.deviceInfo,
            });

            return {
                payload: {
                    user: {
                        id: user.id,
                        email: user.email,
                        fullName: user.fullName,
                        authority: [targetRole.slug],
                        originalAuthority: userRoleSlugs,
                        isImpersonating: true,
                    },
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                    originalRoles: userRoleSlugs,
                    impersonatedRole: targetRole.slug,
                },
            };
        } catch (error) {
            this.logger.error(error.stack || error);
            handleServiceError(error);
        }
    }

    public async stopImpersonating(payload: {
        userId: string;
        refreshToken: string;
        ipAddress?: string;
        deviceInfo?: string;
    }) {
        try {
            // Revoke the impersonation refresh token
            const tokenHash = this.hashToken(payload.refreshToken);
            await this.authRepository.revokeRefreshToken(tokenHash);

            // Get the user with their original roles
            const user = await this.authRepository.findUserWithRoles(
                payload.userId,
            );

            if (!user) {
                throw new UnauthorizedException('User tidak ditemukan.');
            }

            const roleSlugs = user.roles?.map((r) => r.slug) ?? [];

            // Generate new tokens with original roles
            const tokens = await this.generateTokens(
                {
                    id: user.id,
                    email: user.email,
                    name: user.fullName,
                    roles: roleSlugs,
                },
                true,
            );

            // Store the new refresh token
            const newTokenHash = this.hashToken(tokens.refreshToken);
            const refreshExpiration = this.configService.get<string>(
                'jwt.refreshExpirationLong',
            );
            const expiresAt = this.calculateExpirationDate(refreshExpiration);

            await this.authRepository.saveRefreshToken({
                userId: user.id,
                tokenHash: newTokenHash,
                expiresAt,
                deviceInfo: payload.deviceInfo,
                ipAddress: payload.ipAddress,
            });

            // Log the stop impersonation event
            await this.auditService.logImpersonationStop({
                userId: user.id,
                originalRole: roleSlugs.join(','),
                ipAddress: payload.ipAddress,
                deviceInfo: payload.deviceInfo,
            });

            return {
                payload: {
                    user: {
                        id: user.id,
                        email: user.email,
                        fullName: user.fullName,
                        authority: roleSlugs,
                        isImpersonating: false,
                    },
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                    originalRoles: roleSlugs,
                    impersonatedRole: roleSlugs[0] ?? null,
                },
            };
        } catch (error) {
            this.logger.error(error.stack || error);
            handleServiceError(error);
        }
    }
}
