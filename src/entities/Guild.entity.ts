import {
  Column,
  Entity,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Ticket } from './Ticket.entity';

@Entity({ name: 'tbl_guild' })
export default class Guild {
  constructor(partial?: Partial<Guild>) {
    Object.assign(this, partial);
  }

  @PrimaryGeneratedColumn()
  id: number;

  @PrimaryColumn({ nullable: false })
  guildId: string;

  @Column({ default: false })
  ticketSystemEnabled: boolean;

  @Column({ nullable: true })
  ticketSystemChannelId?: string;

  @OneToMany(() => Ticket, (ticket) => ticket.guild, { cascade: true })
  tickets: Ticket[];
}
