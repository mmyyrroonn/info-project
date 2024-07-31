import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { batchSummaryOutputSchema, batchSummarySystemPrompt, filterOutputSchema, filterSystemPrompt, summaryOutputSchema, summarySystemPrompt, replySystemPrompt } from './openai.prompt';
import { MilvusService } from 'src/milvus/milvus.service';

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
  private readonly embedAIEnable;
  private readonly summarySystemPrompt = summarySystemPrompt;
  private readonly replySystemPrompt = replySystemPrompt;
  private readonly summaryOutputSchema = summaryOutputSchema;
  private readonly filterSystemPrompt = filterSystemPrompt;
  private readonly filterOutputSchema = filterOutputSchema;
  private readonly batchSummarySystemPrompt = batchSummarySystemPrompt;
  private readonly batchSummaryOutputSchema = batchSummaryOutputSchema;
  private readonly batchTwitterLength = 10;
  constructor(
    @InjectModel('Summary') private readonly twitterSummaryModel,
    @InjectModel('Embeding') private readonly twitterEmbedingModel,
    @InjectModel('Twitter') private readonly twitterModel,
    private readonly milvusService: MilvusService,
    private readonly configService: ConfigService
  ) {
    this.openai = new OpenAI({
        apiKey: this.configService.get('openaiKey'),
    });
    this.openaiEnable = Boolean(this.configService.get<boolean>('openaiEnable', false));
    this.embedAIEnable = Boolean(this.configService.get<boolean>('embedAIEnable', false));
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
        model: 'gpt-3.5-turbo-0125',
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
        await this.saveToSummary(twitters[i].tweetId, twitters[i].userName, res[i]);
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


  @Cron(CronExpression.EVERY_10_SECONDS)
  async tryToEmbedMultipleTwitter() {
    if(!this.embedAIEnable) {
      console.log("embedAIEnable is not enabled and skip it");
      return;
    }
    let twitters = await this.twitterModel.find({ embedded: false, type: "Post" }).sort({ retryCount: -1 }).limit(this.batchTwitterLength).exec();
    if (twitters.length < this.batchTwitterLength) {
      console.log("Not enough twitter to embed and skip this round");
      return;
    }
    for(const twitter of twitters) {
      try {
        const embedding = await this.getEmbedding(twitter.text);
        await this.saveToEmbedding(twitter.tweetId, twitter.userName, embedding);
        await this.milvusService.insertNewTweetIntoLatest(twitter.tweetId, twitter.createAt, 0, embedding.data[0].embedding);
        console.log(`Insert embedding success ${twitter.tweetId}`);
        await this.twitterModel.updateOne({"_id": twitter._id},{"embedded":true}).exec();
      }
      catch (error) {
        console.error("Something wrong during the openai call");
        console.error(error);
      }
      
    }
  }

  public async getEmbedding(text) {
    const embedding = await this.openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });
    return embedding;
  }


  public async summry(tweetId: string, userName: string, content: string) {
    console.log("Try to summary twitter content: ", content);
    const chatCompletion: OpenAI.Chat.ChatCompletion = await this.openai.chat.completions.create({
        messages: [this.summarySystemPrompt, { role: 'user', content: content }],
        model: 'gpt-3.5-turbo-0125',
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
    await this.saveToSummary(tweetId, userName, res);
  }

  public async reply(content: string) {
    console.log("Try to reply twitter content: ", content);
    const chatCompletion: OpenAI.Chat.ChatCompletion = await this.openai.chat.completions.create({
        messages: [this.replySystemPrompt, { role: 'user', content: content }],
        model: 'gpt-4o',
    });
    let res;
    try {
        res = chatCompletion["choices"][0]["message"];
    } catch (error) {
        console.error('Invalid json format:', chatCompletion);
        return; // 停止执行方法
    }
    return res;
  }

  public async filter(content: string) {
    console.log("Try to filter following users: ", content);
    const chatCompletion: OpenAI.Chat.ChatCompletion = await this.openai.chat.completions.create({
        messages: [this.filterSystemPrompt, { role: 'user', content: content }],
        model: 'gpt-3.5-turbo-0125',
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

  private async saveToSummary(tweetId: string, userName:string, res: any) {
    if (res === null || res.keywords === null || res.score === null){
        console.log('Invalid response object:', res);
        return; // 停止执行方法
    }
    const existingSummary = await this.twitterSummaryModel.findOne({ tweetId }).exec();

    if (existingSummary) {
      // 如果数据库中已经存在与tweetId相匹配的记录，则进行更新
      await this.twitterSummaryModel.updateOne({"_id": existingSummary._id},{"keyWords":res.keywords, "score":res.score, summarizedAt: new Date() }).exec();
    } else {
      // 否则进行创建新的记录
      const newSummary = new this.twitterSummaryModel({ tweetId, userName, keyWords: res.keywords, score: res.score, summarizedAt: new Date()});
      await newSummary.save();
    }
  }

  private async saveToEmbedding(tweetId: string, userName:string, res: any) {
    if (res.length){
        console.log('Invalid response object:', res);
        return; // 停止执行方法
    }
    const existingEmbeding = await this.twitterEmbedingModel.findOne({ tweetId }).exec();

    if (existingEmbeding) {
      // 如果数据库中已经存在与tweetId相匹配的记录，则进行更新
      await this.twitterEmbedingModel.updateOne({"_id": existingEmbeding._id},{"feature":res, embeddedAt: new Date() }).exec();
    } else {
      // 否则进行创建新的记录
      const newEmbedding = new this.twitterEmbedingModel({ tweetId, userName, feature: res, embeddedAt: new Date()});
      await newEmbedding.save();
    }
  }
}