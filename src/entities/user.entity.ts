import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';

import { RoleEntity } from './role.entity';

@Entity('users')
export class UserEntity extends BaseEntity {
    @Column({
        type: 'varchar',
        length: 255,
        unique: true,
        nullable: false,
    })
    fullName: string;

    @Column({
        type: 'varchar',
        length: 255,
        unique: true,
        nullable: false,
    })
    email: string;

    @Column({
        type: 'varchar',
        length: 255,
        nullable: false,
    })
    password: string;

    @ManyToOne(() => RoleEntity, (role) => role.users)
    @JoinColumn({ name: 'role_id' })
    role: RoleEntity;
}
