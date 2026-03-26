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
}
