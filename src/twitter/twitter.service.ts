import { Injectable } from '@nestjs/common';
import { CreateTwitterDto } from './dto/create-twitter.dto';
import { InjectModel } from '@nestjs/mongoose';
import { OpenAIProvider } from 'src/openai/openai.provider';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { assert, time } from 'console';

@Injectable()
export class TwitterService {
  private readonly usersSliceLength = 10;
  private readonly retryCount = 3;
  constructor(
    @InjectModel('Twitter') private readonly twitterModel,
    @InjectModel('TwitterUser') private readonly twitterUserModel,
    @InjectModel('Summary') private readonly twitterSummaryModel,
    private readonly openaiService: OpenAIProvider
  ) {

  }

  async create(createTwitterDto: CreateTwitterDto, type: String) {
    // this.openaiService.summry(createTwitterDto.tweetId, createTwitterDto.userName, createTwitterDto.text);
    createTwitterDto.text = createTwitterDto.text?.trim();
    createTwitterDto.userName = createTwitterDto.userName?.trim();
    const tweetId = createTwitterDto.linkToTweet?.trim().split('/')[-1];
    if(!createTwitterDto.text){
      console.log("no text and return");
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
      retryCount: this.retryCount
    });
    return await model.save();
  }

  async storeUsersAndFilter(users) {
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      delete user.id;

      // Check if user with the same ID already exists in the database
      const existingUser = await this.twitterUserModel.findOne({ rest_id: user.rest_id });
      // TODO: support update and retrigger judgement

      if (!existingUser) {
        // User does not exist, insert into the database
        const model = new this.twitterUserModel({
          ...user,
          isWorthAnalyze: false,
          filtered: false,
          lastFilterTime: new Date(),
          lastUpdateTime: new Date()
        });

        await model.save();
      }
    }
  }

  async filterFollowing(count) {
    try {
      let users = await this.twitterUserModel.find({ filtered: false }).limit(this.usersSliceLength).exec();

      const res: Array<boolean> = await this.toFilterUsers(users);
      if (users.length != res.length) {
        console.error("something wrong, failed this time");
        return;
      }
      for(let i = 0; i < users.length; i++) {
        let user = users[i];
        const isWorth = res[i];
        await this.twitterUserModel.updateOne({"_id": user._id}, {"isWorthAnalyze": isWorth, "filtered": true, "lastFilterTime": new Date()}).exec();
      }

      console.log(`Updated ${users.length} users.`);
    } catch (error) {
      console.error(error);
    }
  }


  async toFilterUsers(users) {
    let concatenatedString = '[';

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      concatenatedString += '"';
      concatenatedString += user.legacy.description?user.legacy.description:"null";
      concatenatedString += '"';
      concatenatedString += ',';
    }

    concatenatedString += ']';
    // 调用 openaiService 的 filter 方法，传递拼接后的字符串作为参数
    const results = await this.openaiService.filter(concatenatedString);

    console.log(results);
    return results;
  }

  async queryWorthUsers() {
    const users = await this.twitterUserModel.find({ isWorthAnalyze: true }).exec();
    const names = users.map(user => user.legacy.screen_name);
    return names;
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
