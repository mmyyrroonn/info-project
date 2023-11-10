import { Injectable } from '@nestjs/common';
import { CreateTwitterDto } from './dto/create-twitter.dto';
import { InjectModel } from '@nestjs/mongoose';
import { OpenAIProvider } from 'src/openai/summary.provider';

@Injectable()
export class TwitterService {
  constructor(
    @InjectModel('Twitter') private readonly twitterModel,
    private readonly openaiService: OpenAIProvider
  ) { }

  async create(createTwitterDto: CreateTwitterDto) {
    const model = new this.twitterModel(createTwitterDto);
    return await model.save();
  }
}
