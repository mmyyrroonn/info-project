import { Body, Controller, Get, Post } from '@nestjs/common';
import { OpenAIProvider } from './openai.provider';
import { queryReplyDto } from './dto/reply-twitter.dto';

@Controller('openai')
export class OpenAIController {
  constructor(private readonly openaiService: OpenAIProvider) {}

  @Post("/getReply")
  getReply(@Body() queryReply: queryReplyDto) {
    return this.openaiService.reply(queryReply.content);
  }
}
