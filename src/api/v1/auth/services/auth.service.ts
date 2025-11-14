import {
    ConflictException,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
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

    public async login(payload: { email: string; password: string }) {
        try {
            const user = await this.authRepository.findByEmail(payload.email);

            if (!user) {
                throw new UnauthorizedException('Invalid credentials.');
            }

            const isPasswordValid = await this.comparePassword(
                payload.password,
                user.password,
            );

            if (!isPasswordValid) {
                throw new UnauthorizedException('Invalid credentials.');
            }

            const tokens = await this.generateTokens({
                id: user.id,
                name: user.fullName,
                email: user.email,
                roles: [],
            });

            return {
                payload: {
                    user: {
                        id: user.id,
                        email: user.email,
                        fullName: user.fullName,
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

    private async generateTokens(user: {
        id: string;
        email: string;
        name: string;
        roles: string[];
    }) {
        try {
            const payload = {
                id: user.id,
                email: user.email,
                name: user.name,
                roles: user.roles,
            };

            const [accessToken, refreshToken] = await Promise.all([
                this.jwtService.signAsync(payload, {
                    secret: this.configService.get<string>('jwt.accessSecret'),
                    expiresIn: '15m',
                }),
                this.jwtService.signAsync(payload, {
                    secret: this.configService.get<string>('jwt.refreshSecret'),
                    expiresIn: '7d',
                }),
            ]);

            return { accessToken, refreshToken };
        } catch (error) {
            throw Error(error);
        }
    }
}
