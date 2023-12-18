import { Module } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { AnalysisController } from './analysis.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { TwitterSchema, TwitterUserSchema } from 'src/twitter/schema/twitter.schema';
import { TwitterSummarySchema } from 'src/openai/schema/summary.schema';

@Module({imports: [
  MongooseModule.forFeature([
    { name: 'Twitter', schema: TwitterSchema },
    { name: 'TwitterUser', schema: TwitterUserSchema },
    { name: 'Summary', schema: TwitterSummarySchema },
    { name: 'TwitterArchive', schema: TwitterSchema },
    { name: 'SummaryArchive', schema: TwitterSummarySchema },
  ])
  ],
  controllers: [AnalysisController],
  providers: [AnalysisService],
})
export class AnalysisModule {}
