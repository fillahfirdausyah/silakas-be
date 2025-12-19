import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';

import { RoleEntity } from './role.entity';
import { DocumentEntity } from './document.entity';

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

    @OneToMany(() => DocumentEntity, (document) => document.pp)
    ppDocuments: DocumentEntity[];

    @OneToMany(() => DocumentEntity, (document) => document.gugatan)
    gugatanDocuments: DocumentEntity[];

    @OneToMany(() => DocumentEntity, (document) => document.hukum)
    hukumDocuments: DocumentEntity[];
}
