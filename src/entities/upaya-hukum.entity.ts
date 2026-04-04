import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { LawsuitEntity } from './lawsuit.entity';

export enum UpayaHukumType {
    BANDING = 'BANDING',
    KASASI = 'KASASI',
}

@Entity('upaya_hukum')
export class UpayaHukumEntity extends BaseEntity {
    @Column({
        name: 'lawsuit_id',
        type: 'uuid',
        unique: true,
        nullable: false,
    })
    lawsuitId: string;

    @OneToOne(() => LawsuitEntity, (lawsuit) => lawsuit.upayaHukum, {
        nullable: false,
    })
    @JoinColumn({ name: 'lawsuit_id' })
    lawsuit: LawsuitEntity;

    @Column({
        name: 'type',
        type: 'enum',
        enum: UpayaHukumType,
        default: UpayaHukumType.BANDING,
    })
    type: UpayaHukumType;

    @Column({
        name: 'tanggal_daftar',
        type: 'date',
        nullable: false,
    })
    tanggalDaftar: Date;

    @Column({
        name: 'tanggal_daftar_banding',
        type: 'date',
        nullable: false,
    })
    tanggalDaftarBanding: Date;

    @Column({
        name: 'tanggal_daftar_kasasi',
        type: 'date',
        nullable: true,
    })
    tanggalDaftarKasasi: Date | null;

    // Banding dates
    @Column({
        name: 'putus_date_banding',
        type: 'date',
        nullable: true,
    })
    putusDateBanding: Date | null;

    @Column({
        name: 'pbt_date_banding',
        type: 'date',
        nullable: true,
    })
    pbtDateBanding: Date | null;

    @Column({
        name: 'bht_date_banding',
        type: 'date',
        nullable: true,
    })
    bhtDateBanding: Date | null;

    // Kasasi dates
    @Column({
        name: 'putus_date_kasasi',
        type: 'date',
        nullable: true,
    })
    putusDateKasasi: Date | null;

    @Column({
        name: 'pbt_date_kasasi',
        type: 'date',
        nullable: true,
    })
    pbtDateKasasi: Date | null;

    @Column({
        name: 'bht_date_kasasi',
        type: 'date',
        nullable: true,
    })
    bhtDateKasasi: Date | null;
}
