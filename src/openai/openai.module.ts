import { Module } from '@nestjs/common';
import { OpenAISummaryProvider } from './summary.provider';
import { MongooseModule } from '@nestjs/mongoose';
import { TwitterSummarySchema } from './schema/summary.schema';
import { OpenAIUserFilterProvider } from './koljudgement.provider';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Summary', schema: TwitterSummarySchema }]),
  ],
  providers: [OpenAISummaryProvider, OpenAIUserFilterProvider],
  exports: [OpenAISummaryProvider, OpenAIUserFilterProvider],
})
export class OpenaiModule {}
