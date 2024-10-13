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

interface User {
  id: string;
  socketId: string;
  isPremium: boolean;
  isStreamer: boolean;
}

@WebSocketGateway({ namespace: '/live-stream' })
export class LiveStreamGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private users: Map<string, User> = new Map();

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async handleConnection(client: Socket) {
    console.log(`Live stream client connected: ${client.id}`);
    const token = client.handshake.auth.token;
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findOne(payload.username);
      if (user) {
        this.users.set(client.id, { id: user.id.toString(), socketId: client.id, isPremium: user.isPremium, isStreamer: false });
        client.emit('authenticated', { id: user.id, isPremium: user.isPremium });
      } else {
        client.disconnect();
      }
    } catch (e) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Live stream client disconnected: ${client.id}`);
    this.users.delete(client.id);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, room: string) {
    client.join(room);
    client.emit('joinedRoom', room);
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(client: Socket, room: string) {
    client.leave(room);
    client.emit('leftRoom', room);
  }

  @SubscribeMessage('startStreaming')
  handleStartStreaming(client: Socket, room: string) {
    const user = this.users.get(client.id);
    if (user) {
      if (!user.isPremium) {
        client.emit('error', { message: 'Only premium users can start streaming' });
        return;
      }
      user.isStreamer = true;
      this.server.to(room).emit('streamerJoined', user.id);
    }
  }

  @SubscribeMessage('stopStreaming')
  handleStopStreaming(client: Socket, room: string) {
    const user = this.users.get(client.id);
    if (user) {
      user.isStreamer = false;
      this.server.to(room).emit('streamerLeft', user.id);
    }
  }

  @SubscribeMessage('streamData')
  handleStreamData(client: Socket, payload: { room: string; data: any }) {
    const user = this.users.get(client.id);
    if (user && user.isPremium && user.isStreamer) {
      this.server.to(payload.room).emit('streamData', payload.data);
    } else {
      client.emit('error', { message: 'Only premium users can stream' });
    }
  }
}