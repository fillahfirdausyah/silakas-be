import {
    ConflictException,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { StringValue } from 'ms';
import { handleServiceError } from 'src/shared/utils/handler-service-error.util';
import { AuthRepository } from '../repositories/auth.repository';

@Injectable()
export class AuthService {
    private logger = new Logger(AuthService.name);
    constructor(
        private configService: ConfigService,
        private jwtService: JwtService,
        private authRepository: AuthRepository,
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
                'role',
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

            const tokens = await this.generateTokens(
                {
                    id: user.id,
                    name: user.fullName,
                    email: user.email,
                    role: user.role.slug,
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
                        authority: [user.role.slug],
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
            const newTokens = await this.generateTokens(
                {
                    id: storedToken.user.id,
                    name: storedToken.user.fullName,
                    email: storedToken.user.email,
                    role: storedToken.user.role.slug,
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
            role: string;
        },
        rememberMe: boolean,
    ) {
        try {
            const jwtPayload = {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            };

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
}
