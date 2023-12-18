import { Controller, Post } from '@nestjs/common';
import { BacktaskService } from './backtask.service';

@Controller("backtask")
export class BacktaskController {
  constructor(private readonly backtaskService: BacktaskService) {}

  // @Post("/updateDB")
  // storeLike() {
  //   return this.backtaskService.tryToUpdateDB();
  // }
}
