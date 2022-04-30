import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import Guild from './Guild.entity';

@Entity({ name: 'tbl_quote' })
export class Quote {
  constructor(partial?: Partial<Omit<Quote, 'id'>>) {
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

  @Column({ nullable: false })
  quotedUserId: string;
}
