import { Module } from '@nestjs/common';
import { BacktaskService } from './backtask.service';
import { BacktaskController } from './backtask.controller';
import { TwitterSummarySchema } from 'src/openai/schema/summary.schema';
import { TwitterSchema } from 'src/twitter/schema/twitter.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { TwitterUserSchema } from 'src/twitteruser/schema/twitteruser.schema';
import { EmbedingSchema } from 'src/openai/schema/embedding.schema';

@Module({imports: [
  MongooseModule.forFeature([
    { name: 'Twitter', schema: TwitterSchema },
    { name: 'TwitterArchive', schema: TwitterSchema },
    { name: 'TwitterUser', schema: TwitterUserSchema },
    { name: 'Summary', schema: TwitterSummarySchema },
    { name: 'SummaryArchive', schema: TwitterSummarySchema },
    { name: 'Embedings', schema: EmbedingSchema },
    { name: 'EmbedingsArchive', schema: EmbedingSchema },
  ]),
  ScheduleModule.forRoot()
  ],
  controllers: [BacktaskController],
  providers: [BacktaskService],
})
export class BacktaskModule {}
