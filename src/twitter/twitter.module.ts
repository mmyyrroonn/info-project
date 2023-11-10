import { Module } from '@nestjs/common';
import { TwitterService } from './twitter.service';
import { TwitterController } from './twitter.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { TwitterSchema } from './schema/twitter.schema';
import { OpenaiModule } from 'src/openai/openai.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Twitter', schema: TwitterSchema }]),
    OpenaiModule
  ],
  controllers: [TwitterController],
  providers: [TwitterService, ],
  exports: [TwitterService],
})
export class TwitterModule {}
