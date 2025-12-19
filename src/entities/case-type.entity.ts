import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';

import { DocumentEntity } from './document.entity';

@Entity('case_types')
export class CaseTypeEntity extends BaseEntity {
    @Column({
        name: 'name',
        type: 'varchar',
        length: 255,
        unique: true,
        nullable: false,
    })
    name: string;

    @Column({
        name: 'description',
        type: 'varchar',
        length: 255,
        nullable: false,
    })
    description: string;

    @OneToMany(() => DocumentEntity, (document) => document.caseType)
    documents: DocumentEntity[];
}
