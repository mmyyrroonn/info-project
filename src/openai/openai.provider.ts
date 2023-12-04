import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { batchSummaryOutputSchema, batchSummarySystemPrompt, filterOutputSchema, filterSystemPrompt, summaryOutputSchema, summarySystemPrompt } from './openai.prompt';

type SUMMARY = {
  keywords: [string]
  score: number
}

type BATCHSUMMARY = {
  results: [{
    keywords: [string]
    score: number
  }]
}

type FILTERRES = {
  result: [boolean]
}

@Injectable()
export class OpenAIProvider {
  private readonly openai;
  private readonly openaiEnable;
  private readonly summarySystemPrompt = summarySystemPrompt;
  private readonly summaryOutputSchema = summaryOutputSchema;
  private readonly filterSystemPrompt = filterSystemPrompt;
  private readonly filterOutputSchema = filterOutputSchema;
  private readonly batchSummarySystemPrompt = batchSummarySystemPrompt;
  private readonly batchSummaryOutputSchema = batchSummaryOutputSchema;
  private readonly batchTwitterLength = 10;
  constructor(
    @InjectModel('Summary') private readonly twitterSummaryModel,
    @InjectModel('Twitter') private readonly twitterModel,
    private readonly configService: ConfigService
  ) {
    this.openai = new OpenAI({
        apiKey: this.configService.get('openaiKey'),
    });
    this.openaiEnable = Boolean(this.configService.get<boolean>('openaiEnable', false));
  }

  public getOpenAI() {
    return this.openai;
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async tryToSummaryMultipleTwitter() {
    if(!this.openaiEnable) {
      console.log("openai not enabled and skip it");
      return;
    }
    let twitters = await this.twitterModel.find({ summarized: false, type: "Post" }).sort({ retryCount: -1 }).limit(this.batchTwitterLength).exec();
    if (twitters.length < this.batchTwitterLength) {
      console.log("Not enough twitter to summary and skip this round");
      return;
    }
    let chatCompletion: OpenAI.Chat.ChatCompletion;
    let isSuccess = true;
    try{
      const twittersString = JSON.stringify(twitters.map((obj, index) => obj.text).reduce((acc, text, index) => {
        acc[index] = text;
        return acc;
      }, {}));
      console.log("summary content: ", twittersString);
      chatCompletion = await this.openai.chat.completions.create({
        messages: [this.batchSummarySystemPrompt, { role: 'user', content: twittersString }],
        model: 'gpt-3.5-turbo',
        functions: [
          {
              name: "createBatchSummaryObject",
              parameters: this.batchSummaryOutputSchema
          }
        ],
        function_call: { name: "createBatchSummaryObject" }
      });
    } catch (error) {
      console.error("Something wrong during the openai call");
      isSuccess = false;
    }

    let res;
    try {
      if(isSuccess) {
        res = <BATCHSUMMARY>JSON.parse(chatCompletion["choices"][0]["message"]["function_call"]["arguments"]);
      }
    } catch (error) {
        console.error('Invalid json format:', chatCompletion["choices"][0]["message"]["function_call"]["arguments"]);
        isSuccess = false;
    }
    res = res["result"];
    if (isSuccess && twitters.length != res.length) {
      console.error("something wrong, failed to summary this round");
      isSuccess = false;
    }
    if(isSuccess) {
      for(let i = 0; i < twitters.length; ++i){
        await this.saveToDatabase(twitters[i].linkToTweet, res[i]);
        await this.twitterModel.updateOne({"_id": twitters[i]._id},{"summarized":true}).exec();
      }
    } else {
      for(let i = 0; i < twitters.length; ++i)
      {
        const lastestRetryCount = twitters[i].retryCount - 1;
        const updateContent = {"retryCount":lastestRetryCount, "summarized": lastestRetryCount == 0};
        await this.twitterModel.updateOne({"_id": twitters[i]._id}, updateContent).exec();
      }
    }
  }

  public async summry(linkToTweet: string, content: string) {
    console.log("Try to summary twitter content: ", content);
    const chatCompletion: OpenAI.Chat.ChatCompletion = await this.openai.chat.completions.create({
        messages: [this.summarySystemPrompt, { role: 'user', content: content }],
        model: 'gpt-3.5-turbo',
        functions: [
          {
              name: "createSummaryObject",
              parameters: this.summaryOutputSchema
          }
        ],
        function_call: { name: "createSummaryObject" }
    });
    let res;
    try {
        res = <SUMMARY>JSON.parse(chatCompletion["choices"][0]["message"]["function_call"]["arguments"]);
    } catch (error) {
        console.error('Invalid json format:', chatCompletion["choices"][0]["message"]["function_call"]["arguments"]);
        return; // 停止执行方法
    }
    await this.saveToDatabase(linkToTweet, res);
  }

  public async filter(content: string) {
    console.log("Try to filter following users: ", content);
    const chatCompletion: OpenAI.Chat.ChatCompletion = await this.openai.chat.completions.create({
        messages: [this.filterSystemPrompt, { role: 'user', content: content }],
        model: 'gpt-3.5-turbo',
        functions: [
          {
              name: "createFilterObject",
              parameters: this.filterOutputSchema
          }
        ],
        function_call: { name: "createFilterObject" }
    });
    let res;
    try {
        res = <FILTERRES>JSON.parse(chatCompletion["choices"][0]["message"]["function_call"]["arguments"]);
    } catch (error) {
        console.error('Invalid json format:', chatCompletion["choices"][0]["message"]["function_call"]["arguments"]);
        return []; // 停止执行方法
    }
    return res["result"];
  }

  private async saveToDatabase(linkToTweet: string, res: any) {
    if (res === null || res.keywords === null || res.score === null){
        console.log('Invalid response object:', res);
        return; // 停止执行方法
    }
    const existingSummary = await this.twitterSummaryModel.findOne({ linkToTweet }).exec();

    if (existingSummary) {
      // 如果数据库中已经存在与linkToTweet相匹配的记录，则进行更新
      await this.twitterSummaryModel.updateOne({"_id": existingSummary._id},{"keyWords":res.keywords, "score":res.score, summarizedAt: new Date() }).exec();
    } else {
      // 否则进行创建新的记录
      const newSummary = new this.twitterSummaryModel({ linkToTweet, keyWords: res.keywords, score: res.score, summarizedAt: new Date()});
      await newSummary.save();
    }
  }
}