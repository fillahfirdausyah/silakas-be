import { Column, Entity, ManyToMany } from 'typeorm';
import { BaseEntity } from './base.entity';

import { UserEntity } from './user.entity';

@Entity('roles')
export class RoleEntity extends BaseEntity {
    @Column({
        type: 'varchar',
        length: 255,
        unique: true,
        nullable: false,
    })
    name: string;

    @Column({
        type: 'varchar',
        length: 255,
        nullable: false,
    })
    slug: string;

    @Column({
        type: 'varchar',
        length: 255,
        nullable: false,
    })
    description: string;

    @ManyToMany(() => UserEntity, (user) => user.roles)
    users: UserEntity[];
}
