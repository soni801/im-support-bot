import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import Guild from './Guild.entity';

@Entity({ name: 'tbl_sladder' })
export class Sladder {
  constructor(partial?: Partial<Sladder>) {
    Object.assign(this, partial);
  }

  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  userId: string;

  @Index({ fulltext: true })
  @Column({ nullable: false })
  content!: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Guild, (guild) => guild.sladders)
  guild: Guild;
}
