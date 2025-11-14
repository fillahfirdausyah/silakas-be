import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('roles')
export class RoleEntity extends BaseEntity {
    @Column({
        type: 'varchar',
        length: 255,
        unique: true,
        nullable: false,
    })
    @Index()
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
}
