import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('document_classifications')
export class DocumentClassificationEntity extends BaseEntity {
    @Index({ unique: true })
    @Column({
        name: 'name',
        type: 'varchar',
        length: 255,
        nullable: false,
    })
    name: string;

    @Index({ unique: true })
    @Column({
        name: 'code',
        type: 'varchar',
        length: 50,
        nullable: false,
    })
    code: string;

    @Column({
        name: 'description',
        type: 'varchar',
        length: 500,
        nullable: true,
    })
    description: string | null;

    @Column({
        name: 'is_active',
        type: 'boolean',
        default: true,
    })
    isActive: boolean;
}