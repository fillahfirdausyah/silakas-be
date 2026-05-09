import { Column, Entity, JoinTable, ManyToMany, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';

import { RoleEntity } from './role.entity';
import { DocumentEntity } from './document.entity';
import { LawsuitEntity } from './lawsuit.entity';

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
        unique: true,
        nullable: true,
        default: null,
    })
    username: string | null;

    @Column({
        type: 'varchar',
        length: 255,
        nullable: false,
    })
    password: string;

    @ManyToMany(() => RoleEntity, (role) => role.users)
    @JoinTable({
        name: 'user_roles',
        joinColumn: { name: 'user_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
    })
    roles: RoleEntity[];

    @OneToMany(() => DocumentEntity, (document) => document.pp)
    ppDocuments: DocumentEntity[];

    @OneToMany(() => DocumentEntity, (document) => document.gugatan)
    gugatanDocuments: DocumentEntity[];

    @OneToMany(() => DocumentEntity, (document) => document.hukum)
    hukumDocuments: DocumentEntity[];

    @OneToMany(() => LawsuitEntity, (lawsuit) => lawsuit.pp)
    ppLawsuits: LawsuitEntity[];

    @OneToMany(() => LawsuitEntity, (lawsuit) => lawsuit.panmudGugatan)
    gugatanLawsuits: LawsuitEntity[];

    @OneToMany(() => LawsuitEntity, (lawsuit) => lawsuit.panmudPermohonan)
    permohonanLawsuits: LawsuitEntity[];

    @OneToMany(() => LawsuitEntity, (lawsuit) => lawsuit.panmudHukum)
    hukumLawsuits: LawsuitEntity[];

    @OneToMany(() => LawsuitEntity, (lawsuit) => lawsuit.js)
    jsLawsuits: LawsuitEntity[];
}
