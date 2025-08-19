import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('find')
  async findByEmail(@Query('email') email: string) {
    const user = await this.userService.findByEmail(email);
    return user;
  }
  @Post('create')
  async createUser(@Body('email') email: string) {
    return await this.userService.createUser(email);
  }
}
