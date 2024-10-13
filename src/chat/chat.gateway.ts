import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { ChatService } from './chat.service';

@WebSocketGateway({ namespace: '/chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private users: Map<string, { id: number; socketId: string; isPremium: boolean }> = new Map();

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private chatService: ChatService,
  ) {}

  async handleConnection(client: Socket) {
    console.log(`Chat client connected: ${client.id}`);
    const token = client.handshake.auth.token;
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findOne(payload.username);
      if (user) {
        this.users.set(client.id, { id: user.id, socketId: client.id, isPremium: user.isPremium });
        client.emit('authenticated', { id: user.id, isPremium: user.isPremium });
      } else {
        client.disconnect();
      }
    } catch (e) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Chat client disconnected: ${client.id}`);
    this.users.delete(client.id);
  }

  @SubscribeMessage('sendPrivateMessage')
  async handlePrivateMessage(client: Socket, payload: { recipientId: number; message: string; type: 'text' | 'voice' }) {
    const sender = this.users.get(client.id);
    const recipient = Array.from(this.users.values()).find(user => user.id === payload.recipientId);

    if (sender && recipient) {
      if (payload.type === 'voice' && !sender.isPremium) {
        client.emit('error', { message: 'Voice messages are only available for premium users' });
        return;
      }

      const senderUser = await this.usersService.findOne(sender.id.toString());
      const recipientUser = await this.usersService.findOne(recipient.id.toString());

      const message = await this.chatService.createMessage(payload.message, payload.type, senderUser, recipientUser);

      this.server.to(recipient.socketId).emit('newPrivateMessage', {
        id: message.id,
        senderId: sender.id,
        message: payload.message,
        type: payload.type,
        createdAt: message.createdAt,
      });
    }
  }

  @SubscribeMessage('getMessageHistory')
  async handleGetMessageHistory(client: Socket, payload: { otherUserId: number }) {
    const user = this.users.get(client.id);
    if (user) {
      const messages = await this.chatService.getMessagesBetweenUsers(user.id, payload.otherUserId);
      client.emit('messageHistory', messages);
    }
  }
}