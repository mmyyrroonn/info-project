import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TwitterModule } from './twitter/twitter.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { TwitterSchema } from './twitter/schema/twitter.schema';
import { LoggerMiddleware } from './common/logger.middleware';
import { OpenaiModule } from './openai/openai.module';
import { TwitterSummarySchema } from './openai/schema/summary.schema';
import { BacktaskModule } from './backtask/backtask.module';
import { AnalysisModule } from './analysis/analysis.module';
import { TwitteruserModule } from './twitteruser/twitteruser.module';
import { TwitterUserSchema } from './twitteruser/schema/twitteruser.schema';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true, // 设置为全局
    // envFilePath: [envConfig.path],
    envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
  }),
  MongooseModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
      return {
        uri: configService.get('DB_HOST', 'localhost'), // 主机，默认为localhost
        user: configService.get('DB_USER', 'admin'), // 用户名
        pass: configService.get('DB_PASS', 'admin'), // 密码
        dbName: configService.get('DB_NAME', 'info'), //数据库名
      };
    },
  }),
  MongooseModule.forFeature([
    { name: 'Twitter', schema: TwitterSchema },
    { name: 'TwitterUser', schema: TwitterUserSchema },
    { name: 'Summary', schema: TwitterSummarySchema }
  ]),
  TwitterModule,
  OpenaiModule,
  BacktaskModule,
  AnalysisModule,
  TwitteruserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
