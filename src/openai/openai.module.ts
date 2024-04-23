import { Module } from '@nestjs/common';
import { OpenAIProvider } from './openai.provider';
import { MongooseModule } from '@nestjs/mongoose';
import { TwitterSummarySchema } from './schema/summary.schema';
import { ScheduleModule } from '@nestjs/schedule';
import { TwitterSchema } from 'src/twitter/schema/twitter.schema';
import { EmbedingSchema } from './schema/embedding.schema';
import { MilvusModule } from 'src/milvus/milvus.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Summary', schema: TwitterSummarySchema },
      { name: 'Embeding', schema: EmbedingSchema },
      { name: 'Twitter', schema: TwitterSchema }
    ]),
    ScheduleModule.forRoot(),
    MilvusModule
  ],
  providers: [OpenAIProvider],
  exports: [OpenAIProvider],
})
export class OpenaiModule {}
