import { Body, Controller, Post } from '@nestjs/common';
import { GameService } from './game.service';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('roll')
  async rollGame(@Body('sessionId') sessionId: string) {
    const result = await this.gameService.roll(+sessionId);
    return result;
  }
}
