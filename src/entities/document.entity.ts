import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

import { CaseTypeEntity } from './case-type.entity';
import { UserEntity } from './user.entity';

enum DocumentPosition {
    PANITERA_PENGGANTI = 'Panitera Pengganti',
    PANMUD_GUGATAN = 'Panmud Gugatan',
    PANMUD_HUKUM = 'Panmud Hukum',
}

@Entity('documents')
export class DocumentEntity extends BaseEntity {
    @Column({
        name: 'case_number',
        type: 'varchar',
        length: 255,
        unique: true,
        nullable: false,
    })
    caseNumber: string;

    @Column({
        name: 'position_at',
        type: 'enum',
        nullable: false,
        enum: DocumentPosition,
    })
    positionAt: string;

    @Column({
        name: 'information',
        type: 'varchar',
        nullable: true,
    })
    information: string | null;

    @Column({
        name: 'pbt_date',
        type: 'datetime',
        nullable: false,
    })
    pbtDate: Date;

    @Column({
        name: 'bht_date',
        type: 'datetime',
        nullable: false,
    })
    bhtDate: Date;

    @Column({
        name: 'pledge_date',
        type: 'datetime',
        nullable: true,
    })
    pledgeDate: Date | null;

    @Column({
        name: 'status',
        type: 'varchar',
        length: 255,
        nullable: false,
    })
    status: string;

    @ManyToOne(() => CaseTypeEntity, (caseType) => caseType.documents, {
        nullable: true,
    })
    @JoinColumn({ name: 'case_type_id' })
    caseType: CaseTypeEntity;

    @ManyToOne(() => UserEntity, (user) => user.ppDocuments, { nullable: true })
    @JoinColumn({ name: 'pp_id' })
    pp: UserEntity | null;

    @ManyToOne(() => UserEntity, (user) => user.gugatanDocuments, {
        nullable: true,
    })
    @JoinColumn({ name: 'gugatan_id' })
    gugatan: UserEntity | null;

    @ManyToOne(() => UserEntity, (user) => user.hukumDocuments, {
        nullable: true,
    })
    @JoinColumn({ name: 'hukum_id' })
    hukum: UserEntity | null;
}
