import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserEntity } from './user.entity';

export enum LawsuitStatus {
    DRAFT = 'DRAFT',
    SUBMITTED_TO_GUGATAN = 'SUBMITTED_TO_GUGATAN',
    RECEIVED_BY_GUGATAN = 'RECEIVED_BY_GUGATAN',
    SUBMITTED_TO_HUKUM = 'SUBMITTED_TO_HUKUM',
    RECEIVED_BY_HUKUM = 'RECEIVED_BY_HUKUM',
}

@Entity('lawsuits')
export class LawsuitEntity extends BaseEntity {
    @Column({
        name: 'case_number',
        type: 'varchar',
        length: 255,
        unique: true,
        nullable: false,
    })
    caseNumber: string;

    @Column({
        name: 'decision_date',
        type: 'date', // or datetime, PRD says "Tanggal Putusan"
        nullable: false,
    })
    decisionDate: Date;

    @Column({
        name: 'classification',
        type: 'varchar',
        length: 255,
        nullable: false,
    })
    classification: string;

    @Column({
        name: 'status',
        type: 'enum',
        enum: LawsuitStatus,
        default: LawsuitStatus.DRAFT,
    })
    status: LawsuitStatus;

    // Dates for tracking
    @Column({
        name: 'submitted_to_gugatan_at',
        type: 'timestamp',
        nullable: true,
    })
    submittedToGugatanAt: Date | null;

    @Column({
        name: 'received_by_gugatan_at',
        type: 'timestamp',
        nullable: true,
    })
    receivedByGugatanAt: Date | null;

    @Column({ name: 'pbt_date', type: 'date', nullable: true })
    pbtDate: Date | null;

    @Column({ name: 'bht_date', type: 'date', nullable: true })
    bhtDate: Date | null;

    @Column({ name: 'ikrar_date', type: 'date', nullable: true })
    ikrarDate: Date | null;

    @Column({
        name: 'submitted_to_hukum_at',
        type: 'timestamp',
        nullable: true,
    })
    submittedToHukumAt: Date | null;

    @Column({ name: 'received_by_hukum_at', type: 'timestamp', nullable: true })
    receivedByHukumAt: Date | null;

    // Relations
    @ManyToOne(() => UserEntity, (user) => user.ppLawsuits)
    @JoinColumn({ name: 'pp_id' })
    pp: UserEntity;

    @ManyToOne(() => UserEntity, (user) => user.gugatanLawsuits, {
        nullable: true,
    })
    @JoinColumn({ name: 'panmud_gugatan_id' })
    panmudGugatan: UserEntity | null;

    @ManyToOne(() => UserEntity, (user) => user.hukumLawsuits, {
        nullable: true,
    })
    @JoinColumn({ name: 'panmud_hukum_id' })
    panmudHukum: UserEntity | null;
}
