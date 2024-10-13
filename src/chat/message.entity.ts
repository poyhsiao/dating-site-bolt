import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @Column()
  type: 'text' | 'voice';

  @ManyToOne(() => User, user => user.sentMessages)
  sender: User;

  @ManyToOne(() => User, user => user.receivedMessages)
  recipient: User;

  @CreateDateColumn()
  createdAt: Date;
}