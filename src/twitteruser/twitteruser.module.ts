import { Module } from '@nestjs/common';
import { TwitteruserService } from './twitteruser.service';
import { TwitteruserController } from './twitteruser.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { TwitterUserSchema } from './schema/twitteruser.schema';
import { MulterModule } from '@nestjs/platform-express';
import { OpenaiModule } from 'src/openai/openai.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'TwitterUser', schema: TwitterUserSchema },
    ]),
    OpenaiModule,
    MulterModule.register({
      dest: './uploads', // 上传的文件将保存在这个目录下
    }),
  ],
  controllers: [TwitteruserController],
  providers: [TwitteruserService],
  exports: [TwitteruserService],
})
export class TwitteruserModule {}
