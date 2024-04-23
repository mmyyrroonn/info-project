import { Controller } from '@nestjs/common';
import { MilvusService } from './milvus.service';

@Controller()
export class MilvusController {
  constructor(private readonly milvusService: MilvusService) {}
}
