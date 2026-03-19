import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserEntity } from './user.entity';

@Entity('refresh_tokens')
export class RefreshTokenEntity extends BaseEntity {
    @Column({
        name: 'token_hash',
        type: 'varchar',
        length: 255,
        nullable: false,
    })
    @Index()
    tokenHash: string;

    @Column({
        name: 'expires_at',
        type: 'timestamp',
        nullable: false,
    })
    expiresAt: Date;

    @Column({
        name: 'revoked_at',
        type: 'timestamp',
        nullable: true,
    })
    revokedAt: Date | null;

    @Column({
        name: 'device_info',
        type: 'varchar',
        length: 500,
        nullable: true,
    })
    deviceInfo: string | null;

    @Column({
        name: 'ip_address',
        type: 'varchar',
        length: 45,
        nullable: true,
    })
    ipAddress: string | null;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'user_id' })
    user: UserEntity;

    @Column({ name: 'user_id' })
    userId: string;
}
