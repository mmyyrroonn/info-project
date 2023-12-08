import { Controller } from '@nestjs/common';
import { BacktaskService } from './backtask.service';

@Controller()
export class BacktaskController {
  constructor(private readonly backtaskService: BacktaskService) {}
}
