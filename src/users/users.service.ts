import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOne(username: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async create(username: string, password: string, isAdmin: boolean = false): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      username,
      password: hashedPassword,
      isAdmin,
    });
    return this.usersRepository.save(user);
  }

  async updatePremiumStatus(userId: number, isPremium: boolean): Promise<User> {
    await this.usersRepository.update(userId, { isPremium });
    return this.usersRepository.findOne({ where: { id: userId } });
  }

  async isAdmin(userId: number): Promise<boolean> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    return user ? user.isAdmin : false;
  }

  async getAllUsers(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async deleteUser(userId: number): Promise<void> {
    await this.usersRepository.delete(userId);
  }
}