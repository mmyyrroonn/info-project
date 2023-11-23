import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { InjectModel } from '@nestjs/mongoose';

type SUMMARY = {
  keywords: [string]
  score: number
}

@Injectable()
export class OpenAISummaryProvider {
  private readonly openai;
  private readonly summarySystemPrompt = {
    "role": "system",
    "content": `
    你是一位精通推特关键词提取，信息分析的大师。同时你热爱加密货币领域，愿意发掘新的机会进行参与。我希望你总结推特信息，提取关键词，并且对此推特内容进行一个重要性评分。
    
    规则:
    - 每次最多提取出5个关键词.
    - 重要性评分为0到10分,最重要为10分,不重要为0分,保留小数点1位.
    - 重要性是基于发掘加密货币领域的消息来说决定.
    - 当发生意外的时候，一定要按照标准格式返回，keywords可以用占位符，重要性评分为0.

    策略:
    - 首先对内容进行大致分类，以此作为重要性评分的一个标准

    返回格式如下, 需要是如下可以被解析的JSON格式, xxx表示占位符:
    {"keywords": ["xxx","xxx","xxx","xxx","xxx"],"score": 7.9}
    `
  }
  private readonly outputSchema = {
    "type": "object",
    "properties": {
      "keywords": {
        "type": "array",
        "items": {"type": "string"}
      },
      "score": {
        "type": "number"
      }
    },
    "required": ["keywords", "score"]
  }

  constructor(
    @InjectModel('Summary') private readonly twitterSummaryModel,
    private readonly configService: ConfigService
  ) {
    this.openai = new OpenAI({
        apiKey: this.configService.get('openaiKey'),
    });

  }

  public getOpenAI() {
    return this.openai;
  }

  public async summry(linkToTweet: string, content: string) {
    console.log("Try to summary twitter content: ", content);
    const chatCompletion: OpenAI.Chat.ChatCompletion = await this.openai.chat.completions.create({
        messages: [this.summarySystemPrompt, { role: 'user', content: content }],
        model: 'gpt-3.5-turbo',
        functions: [
          {
              name: "createSummaryObject",
              parameters: this.outputSchema
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

  private async saveToDatabase(linkToTweet: string, res: any) {
    if (res === null || res.keywords === null || res.score === null){
        console.log('Invalid response object:', res);
        return; // 停止执行方法
    }
    const existingSummary = await this.twitterSummaryModel.findOne({ linkToTweet }).exec();

    if (existingSummary) {
      // 如果数据库中已经存在与linkToTweet相匹配的记录，则进行更新
      existingSummary.keyWords = res.keywords;
      existingSummary.score = res.score;
      await existingSummary.save();
    } else {
      // 否则进行创建新的记录
      const newSummary = new this.twitterSummaryModel({ linkToTweet, keyWords: res.keywords, score: res.score});
      await newSummary.save();
    }
  }
}