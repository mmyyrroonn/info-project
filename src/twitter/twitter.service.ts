import { Injectable } from '@nestjs/common';
import { CreateTwitterDto } from './dto/create-twitter.dto';
import { InjectModel } from '@nestjs/mongoose';
import { OpenAIProvider } from 'src/openai/openai.provider';
import { assert, time } from 'console';

@Injectable()
export class TwitterService {
  private readonly usersSliceLength = 10;
  constructor(
    @InjectModel('Twitter') private readonly twitterModel,
    @InjectModel('TwitterUser') private readonly twitterUserModel,
    private readonly openaiService: OpenAIProvider
  ) {

  }

  async create(createTwitterDto: CreateTwitterDto, type: String) {
    this.openaiService.summry(createTwitterDto.linkToTweet, createTwitterDto.text);
    const model = new this.twitterModel({ ...createTwitterDto, type });
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
      for(let user of users) {
        await this.twitterUserModel.updateOne({"_id": user._id}, {"isWorthAnalyze": true, "filtered": true, "lastFilterTime": new Date()}).exec();
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
      concatenatedString += user.legacy.description;
      concatenatedString += '"';
      concatenatedString += ',';
    }

    concatenatedString += ']';
    // 调用 openaiService 的 filter 方法，传递拼接后的字符串作为参数
    const results = await this.openaiService.filter(concatenatedString);

    console.log(results);
    return results;
  }
}
