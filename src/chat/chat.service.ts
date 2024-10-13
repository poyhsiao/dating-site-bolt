import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './message.entity';
import { User } from '../users/user.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
  ) {}

  async createMessage(content: string, type: 'text' | 'voice', sender: User, recipient: User): Promise<Message> {
    const message = this.messagesRepository.create({
      content,
      type,
      sender,
      recipient,
    });
    return this.messagesRepository.save(message);
  }

  async getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<Message[]> {
    return this.messagesRepository.find({
      where: [
        { sender: { id: user1Id }, recipient: { id: user2Id } },
        { sender: { id: user2Id }, recipient: { id: user1Id } },
      ],
      order: { createdAt: 'ASC' },
      relations: ['sender', 'recipient'],
    });
  }
}