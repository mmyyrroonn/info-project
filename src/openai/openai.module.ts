import { Module } from '@nestjs/common';
import { OpenAIProvider } from './openai.provider';
import { MongooseModule } from '@nestjs/mongoose';
import { TwitterSummarySchema } from './schema/summary.schema';
import { ScheduleModule } from '@nestjs/schedule';
import { TwitterSchema } from 'src/twitter/schema/twitter.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Summary', schema: TwitterSummarySchema },
      { name: 'Twitter', schema: TwitterSchema }
    ]),
    ScheduleModule.forRoot()
  ],
  providers: [OpenAIProvider],
  exports: [OpenAIProvider],
})
export class OpenaiModule {}
