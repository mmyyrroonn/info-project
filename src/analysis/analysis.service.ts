import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class AnalysisService {

  constructor(
    @InjectModel('Twitter') private readonly twitterModel,
    @InjectModel('Summary') private readonly twitterSummaryModel,
    @InjectModel('SummaryArchive') private readonly twitterSummaryArchiveModel,
    @InjectModel('TwitterArchive') private readonly twitterArchiveModel,
  ) {

  }

  async queryUserStatus()
  {
    const documents = await this.twitterSummaryArchiveModel.aggregate([
      { $match: { userName: { $exists: true} } },
      {
        $group: {
          _id: "$userName",
          averageScore: { $avg: "$score" }
        }
      }]).exec();
    return documents;
  }
}
