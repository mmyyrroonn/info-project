import { PartialType } from '@nestjs/swagger';
import { CreateTwitterDto } from './create-twitter.dto';

export class UpdateTwitterDto extends PartialType(CreateTwitterDto) {}
