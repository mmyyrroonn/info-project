import { Module } from '@nestjs/common';
import { OpenAIProvider } from './summary.provider';
import { MongooseModule } from '@nestjs/mongoose';
import { TwitterSummarySchema } from './schema/summary.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Summary', schema: TwitterSummarySchema }]),
  ],
  providers: [OpenAIProvider],
  exports: [OpenAIProvider],
})
export class OpenaiModule {}
