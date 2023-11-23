import { Injectable } from '@nestjs/common';
import { CreateTwitterDto } from './dto/create-twitter.dto';
import { InjectModel } from '@nestjs/mongoose';
import { OpenAISummaryProvider } from 'src/openai/summary.provider';

@Injectable()
export class TwitterService {
  constructor(
    @InjectModel('Twitter') private readonly twitterModel,
    private readonly openaiService: OpenAISummaryProvider
  ) { }

  async create(createTwitterDto: CreateTwitterDto, type: String) {
    this.openaiService.summry(createTwitterDto.linkToTweet, createTwitterDto.text);
    const model = new this.twitterModel({...createTwitterDto, type});
    return await model.save();
  }
}
