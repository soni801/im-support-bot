import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import Guild from './Guild.entity';

@Entity({ name: 'tbl_ticket' })
export class Ticket {
  constructor(partial?: Partial<Ticket>) {
    Object.assign(this, partial);
  }

  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  shortId: string;

  @Column()
  userId: string;

  @Column()
  subject: string;

  @Column()
  category: string;

  @ManyToOne(() => Guild, (guild) => guild.tickets)
  guild: Guild;

  @Column()
  channelId: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  closedAt?: Date;

  @Column({ nullable: true })
  closedBy?: string;

  @Column({ nullable: true })
  closedReason?: string;

  get closed(): boolean {
    return this.closedAt !== null;
  }
}
