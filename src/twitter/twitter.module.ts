import { Module } from '@nestjs/common';
import { TwitterService } from './twitter.service';
import { TwitterController } from './twitter.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { TwitterSchema, TwitterUserSchema } from './schema/twitter.schema';
import { OpenaiModule } from 'src/openai/openai.module';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Twitter', schema: TwitterSchema }, { name: 'TwitterUser', schema: TwitterUserSchema }]),
    OpenaiModule,
    MulterModule.register({
      dest: './uploads', // 上传的文件将保存在这个目录下
    }),
  ],
  controllers: [TwitterController],
  providers: [TwitterService, ],
  exports: [TwitterService],
})
export class TwitterModule {}
