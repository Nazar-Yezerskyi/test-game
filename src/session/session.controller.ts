import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SessionService } from './session.service';

@Controller('session')
export class SessionController {
  constructor(private sessionService: SessionService) {}

  @Post('create')
  async createSession(@Body('userId') userId: string) {
    return this.sessionService.createSessionForUser(+userId);
  }

  @Get('user/:userId')
  async getUserSessions(@Param('userId') userId: string) {
    return this.sessionService.findSessionsByUserId(+userId);
  }

  @Get(':sessionId')
  async getSession(@Param('sessionId') sessionId: string) {
    return this.sessionService.getSession(+sessionId);
  }

  @Post(':sessionId/cashout')
  async cashout(@Param('sessionId') sessionId: string) {
    return this.sessionService.cashout(+sessionId);
  }
}
