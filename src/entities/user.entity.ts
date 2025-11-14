import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('users')
export class UserEntity extends BaseEntity {
    @Column({
        type: 'varchar',
        length: 255,
        unique: true,
        nullable: false,
    })
    @Index()
    fullName: string;

    @Column({
        type: 'varchar',
        length: 255,
        unique: true,
        nullable: false,
    })
    @Index()
    email: string;

    @Column({
        type: 'varchar',
        length: 255,
        nullable: false,
    })
    password: string;
}
