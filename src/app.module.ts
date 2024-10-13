import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LiveStreamModule } from './live-stream/live-stream.module';
import { ChatModule } from './chat/chat.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'your_username',
      password: 'your_password',
      database: 'dating_site_db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // 注意：在生產環境中應設置為 false
    }),
    LiveStreamModule,
    ChatModule,
    AuthModule,
    UsersModule,
    AdminModule,
  ],
})
export class AppModule {}