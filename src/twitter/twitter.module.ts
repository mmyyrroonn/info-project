import { Module } from '@nestjs/common';
import { TwitterService } from './twitter.service';
import { TwitterController } from './twitter.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { TwitterSchema } from './schema/twitter.schema';
import { OpenaiModule } from 'src/openai/openai.module';
import { MulterModule } from '@nestjs/platform-express';
import { TwitterSummarySchema } from 'src/openai/schema/summary.schema';
import { TwitterUserSchema } from 'src/twitteruser/schema/twitteruser.schema';
import { MilvusModule } from 'src/milvus/milvus.module';
import { EmbedingSchema } from 'src/openai/schema/embedding.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Twitter', schema: TwitterSchema },
      { name: 'TwitterUser', schema: TwitterUserSchema },
      { name: 'Summary', schema: TwitterSummarySchema },
      { name: 'Embeding', schema: EmbedingSchema },
    ]),
    OpenaiModule,
    MilvusModule,
    MulterModule.register({
      dest: './uploads', // 上传的文件将保存在这个目录下
    }),
  ],
  controllers: [TwitterController],
  providers: [TwitterService, ],
  exports: [TwitterService],
})
export class TwitterModule {}
