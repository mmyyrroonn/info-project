import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { InjectModel } from '@nestjs/mongoose';

type FILTERRES = {
  result: [boolean]
}
@Injectable()
export class OpenAIUserFilterProvider {
  private readonly openai;
  private readonly filterSystemPrompt = {
    "role": "system",
    "content": `
    你是一位精通推特关键词提取，信息分析的大师。同时你热爱加密货币领域，愿意发掘新的机会进行参与。
    接下来我会给你若干描述语句，每一个描述语句都是一个推特用户的个人描述，帮我以此判断每一个推特用户是否是在加密货币领域，并且乐于分享研究成果。
    
    规则:
    - 输入为一个列表，列表每一项都是一个用户的一段描述语句

    策略:
    - 对每一个描述语句都分别进行判断

    返回格式如下, 需要是如下可以被解析的JSON格式:
    [False, True, False, True, True]
    `
  }
  private readonly outputSchema = {
    "type": "object",
    "properties": {
      "result": {
        "type": "array",
        "items": {"type": "bool"}
      }
    },
    "required": ["result"]
  }

  constructor(
    private readonly configService: ConfigService
  ) {
    this.openai = new OpenAI({
        apiKey: this.configService.get('openaiKey'),
    });

  }

  public getOpenAI() {
    return this.openai;
  }

  public async filter(content: string) {
    console.log("Try to summary twitter content: ", content);
    const chatCompletion: OpenAI.Chat.ChatCompletion = await this.openai.chat.completions.create({
        messages: [this.filterSystemPrompt, { role: 'user', content: content }],
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
        res = <FILTERRES>JSON.parse(chatCompletion["choices"][0]["message"]["function_call"]["arguments"]);
    } catch (error) {
        console.error('Invalid json format:', chatCompletion["choices"][0]["message"]["function_call"]["arguments"]);
        return []; // 停止执行方法
    }
    return res;
  }
}