import { Injectable, Logger } from '@nestjs/common';
import { CreateTwitterDto } from './dto/create-twitter.dto';
import { InjectModel } from '@nestjs/mongoose';
import { OpenAIProvider } from 'src/openai/openai.provider';
import { Cron, CronExpression } from '@nestjs/schedule';
const axios = require('axios');
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { assert, time } from 'console';
import { ConfigService } from '@nestjs/config';
import { MilvusService } from 'src/milvus/milvus.service';
import { QueryTwitterDto } from './dto/query-twitter.dto';
import { filteredKOLs } from './kols';

@Injectable()
export class TwitterService {
  private readonly retryCount = 3;
  private readonly rapidapikey;
  private readonly queryHour = 12;
  constructor(
    @InjectModel('Twitter') private readonly twitterModel,
    @InjectModel('TwitterUser') private readonly twitterUserModel,
    @InjectModel('Summary') private readonly twitterSummaryModel,
    @InjectModel('Embeding') private readonly twitterEmbedingModel,
    private readonly openaiService: OpenAIProvider,
    private readonly milvusService: MilvusService,
    private readonly configService: ConfigService
  ) {
    this.rapidapikey = this.configService.get('rapidapikey');
  }

  async create(createTwitterDto: CreateTwitterDto, type: String) {
    // this.openaiService.summry(createTwitterDto.tweetId, createTwitterDto.userName, createTwitterDto.text);
    createTwitterDto.text = createTwitterDto.text?.trim();
    createTwitterDto.userName = createTwitterDto.userName?.trim();
    const parts = createTwitterDto.linkToTweet.trim().split('/');
    const tweetId = parts[parts.length - 1];
    if(!createTwitterDto.text || !tweetId){
      console.log("no text or tweet id and return");
      return;
    }
    if(type == "New")
    {
      if(createTwitterDto.text.startsWith("@"))
      {
        type = "Reply";
      } else if(createTwitterDto.text.startsWith("RT"))
      {
        type = "Retweet";
      } else {
        type = "Post";
      }
    }
    const model = new this.twitterModel({
      ...createTwitterDto,
      tweetId,
      createAt: this.convertStringToDate(createTwitterDto.createAt),
      type,
      summarized: false,
      embedded: false,
      retryCount: this.retryCount
    });
    return await model.save();
  }

  async queryLastDaySummary()
  {
    const oneDayAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const withText = await this.twitterSummaryModel.aggregate([
      { $match: { summarizedAt: { $gte: oneDayAgo } } },
      {
        $lookup: {
          from: "twitters",
          localField: "tweetId",
          foreignField: "tweetId",
          as: "filter_twitter"
        }
      },
      { $unwind: "$filter_twitter" },
      {
        $project: {
          tweetId: "$tweetId",
          score: "$score",
          keyWords: "$keyWords",
          text: "$filter_twitter.text",
          createAt: "$filter_twitter.createAt"
        }
      },
      { $sort: { score: -1 } }
    ]).exec();
    return withText;
  }

  async queryLastestTwitter()
  {
    const hours = 6;
    const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);
    const twitterRecords = await this.twitterModel.aggregate([
      // 根据时间过滤最近 6 小时的记录
      { $match: { type: "Post" } },
      { $match: { createAt: { $gte: hoursAgo } } },

      // 过滤掉不在筛选列表中的记录
      { $match: { userName: { $in: filteredKOLs } } },
      { $sort: { createAt: -1 } }
      // 可以根据需要添加其他聚合阶段，如排序、限制数量等
    ]).exec();;

    return twitterRecords;
  }


  async queryRelatedTwitter(queryTwitterDto: QueryTwitterDto) {
    const feature = (await this.openaiService.getEmbedding(queryTwitterDto.query_text)).data[0].embedding;
    const queryResult = await this.milvusService.queryRelatedTwitter(feature, queryTwitterDto.limit);
    let result = []
    for(const query of queryResult) {
      const tweet = await this.twitterModel.findOne({ tweetId: query.tweet_id });
      result.push({
        text: tweet.text,
        userName: tweet.userName,
        createAt: tweet.createAt,
        score: query.score,
        tweetId: tweet.tweetId
      })
    }
    return result;
  }

  async insertHistoryDataIntoMilvus() {
    this.milvusService.initLatestTwitterCollection();
    const oneDayAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const queryResult = await this.twitterEmbedingModel.find({embeddedAt: { $gte: oneDayAgo }});
    for(const res of queryResult){
      await this.milvusService.insertNewTweetIntoLatest(res.tweetId, res.embeddedAt, 0, res.feature[0].data[0].embedding);
    }
  }

  convertStringToDate(dateString) {
    try {
      // 移除多余空格
      dateString = dateString.trim();
      // 将字符串按空格分割为日期和时间部分
      const [datePart, timePart] = dateString.split(' at ');

      // 解析时间部分并获取小时、分钟
      const [time, period] = timePart.split(/(?<=\d)(?=[A-Z]+)/);
      const [hour, minute] = time.split(':');

      // 根据月份的名称获取对应的数字表示
      const date = new Date(Date.parse(datePart));

      date.setHours(parseInt(hour));
      date.setMinutes(parseInt(minute));

      // 如果时间是凌晨，则需要减少12小时
      if (period == 'AM' && hour == '12') {
        date.setHours(date.getHours() - 12);
      }
      // 如果时间部分是下午，则需要增加12小时
      if (period === 'PM' && hour !== '12') {
        date.setHours(date.getHours() + 12);
      }

      return date;
    } catch(error) {
      console.error("Parse timestamp error, return 2020-12-01");
      return new Date(Date.parse("December 01, 2020"));
    }
  }

  // @Cron(CronExpression.EVERY_MINUTE)
  async tryToQueryNewTweets() {
    // 查找所有 apiQuery 为 true 的用户
    const users = await this.twitterUserModel
      .find({ apiQuery: true })
      .sort({ apiQueryLastTime: 1 }) // 1 for ascending order
      .limit(10); // limits the result to 10 documents


    console.log(`Total ${users.length} users to query`)
    // 对每个用户进行轮询处理
    for (const user of users) {
      // 这里添加您的轮询逻辑
      if(user.apiQueryLastTime && new Date(user.apiQueryLastTime.getTime() + this.queryHour * 60 * 60 * 1000) > new Date()){
        // Skip the current iteration if the condition is true
        continue;
      }
      const timeline = await this.queryOneUserTweet(user.screen_name);
      if (!timeline) {
        continue; // 如果timeline为空，跳过当前用户
      }
      for ( const tweet of timeline) {
        const tweetCreatedAt = new Date(tweet.created_at);
        if (user.apiQueryLastTime && tweetCreatedAt < user.apiQueryLastTime) {
          break;
        }
        const existingTwitter = await this.twitterModel.findOne({ tweetId: tweet.tweet_id }).exec();
        if (existingTwitter) {
          continue
        }
        let type = "Post";
        if(tweet.text.startsWith("@"))
        {
          type = "Reply";
        } else if(tweet.text.startsWith("RT"))
        {
          type = "Retweet";
        }
        const model = new this.twitterModel({
          text: tweet.text,
          userName: user.screen_name,
          tweetId: tweet.tweet_id,
          createAt: tweetCreatedAt,
          type,
          summarized: false,
          embedded: false,
          retryCount: this.retryCount
        });
        await model.save();
      }

      // 更新 apiQueryLastTime 到最新时间
      await this.twitterUserModel.updateOne({"_id": user._id},{apiQueryLastTime: new Date() }).exec();
    }
    console.log("Query twitter success")
  }

  async queryOneUserTweet(name: string){
    const options = {
      method: 'GET',
      url: 'https://twitter-api45.p.rapidapi.com/timeline.php',
      params: {
        screenname: name
      },
      headers: {
        'X-RapidAPI-Key': this.rapidapikey,
        'X-RapidAPI-Host': 'twitter-api45.p.rapidapi.com'
      }
    };
    
    try {
      const response = await axios.request(options);
      return response.data["timeline"];
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  // async migrationDB()
  // {
  //   let twitters = await this.twitterModel.find().exec();
  //   for(let i = 0; i < twitters.length; ++i)
  //   {
  //     let twitter = twitters[i];
  //     if(typeof(twitter.createAt) == typeof("string")){
  //       const createAt = this.convertStringToDate(twitter.createAt);
  //       const updateContent = { $set: { createAt: createAt } };
  //       await this.twitterModel.updateOne({"_id": twitters[i]._id}, updateContent).exec();
  //     }
  //   }
  // }
}
