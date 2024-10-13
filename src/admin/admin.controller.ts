import { Controller, Get, Post, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { UsersService } from '../users/users.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private usersService: UsersService) {}

  @Get('users')
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Post('users/:id/premium')
  async upgradeToPremium(@Param('id') id: string) {
    return this.usersService.updatePremiumStatus(parseInt(id), true);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    await this.usersService.deleteUser(parseInt(id));
    return { message: 'User deleted successfully' };
  }
}