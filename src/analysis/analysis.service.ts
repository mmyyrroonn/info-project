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
    const scoresStatus = await this.queryUserScoreStatus();
    const typesStatus = await this.queryUserTypeStatus();
    Object.keys(scoresStatus).forEach(userName => {
      const combinedStatus = {
        AverageScore: scoresStatus[userName],
        Post: typesStatus[userName]?.Post || 0, // db issue and type might be null
        Reply: typesStatus[userName]?.Reply || 0,
        Retweet: typesStatus[userName]?.Retweet || 0};
      scoresStatus[userName] = combinedStatus;
    });
    return scoresStatus;
  }

  async queryUserTypeStatus()
  {
      const userTypeStatus1 = await this.twitterModel.aggregate([
        {
            $facet: {
                "Post": [
                    { $match: { type: "Post" } },
                    {
                        $group: {
                            _id: { userName: "$userName", type: "$type" },
                            count: { $sum: 1 }
                        }
                    }
                ],
                "Reply": [
                    { $match: { type: "Reply" } },
                    {
                        $group: {
                          _id: { userName: "$userName", type: "$type" },
                          count: { $sum: 1 }
                        }
                    }
                ],
                "Retweet": [
                    { $match: { type: "Retweet" } },
                    {
                        $group: {
                          _id: { userName: "$userName", type: "$type" },
                          count: { $sum: 1 }
                        }
                    }
                ]
            }
        },
        {
            $project: {
                combinedResult: { $concatArrays: ["$Post", "$Reply", "$Retweet"] }
            }
        },
        { $unwind: "$combinedResult" },
        {
            $group: {
                _id: "$combinedResult._id.userName",
                Post: { $sum: { $cond: [{ $eq: [ "$combinedResult._id.type", "Post" ] }, "$combinedResult.count", 0] } },
                Reply: { $sum: { $cond: [{ $eq: [ "$combinedResult._id.type", "Reply" ] }, "$combinedResult.count", 0] } },
                Retweet: { $sum: { $cond: [{ $eq: [ "$combinedResult._id.type", "Retweet" ] }, "$combinedResult.count", 0] } }
            }
        }
    ]).exec();


      const userTypeStatus2 = await this.twitterArchiveModel.aggregate([
        {
            $facet: {
                "Post": [
                    { $match: { type: "Post" } },
                    {
                        $group: {
                            _id: { userName: "$userName", type: "$type" },
                            count: { $sum: 1 }
                        }
                    }
                ],
                "Reply": [
                    { $match: { type: "Reply" } },
                    {
                        $group: {
                          _id: { userName: "$userName", type: "$type" },
                          count: { $sum: 1 }
                        }
                    }
                ],
                "Retweet": [
                    { $match: { type: "Retweet" } },
                    {
                        $group: {
                          _id: { userName: "$userName", type: "$type" },
                          count: { $sum: 1 }
                        }
                    }
                ]
            }
        },
        {
            $project: {
                combinedResult: { $concatArrays: ["$Post", "$Reply", "$Retweet"] }
            }
        },
        { $unwind: "$combinedResult" },
        {
            $group: {
                _id: "$combinedResult._id.userName",
                Post: { $sum: { $cond: [{ $eq: [ "$combinedResult._id.type", "Post" ] }, "$combinedResult.count", 0] } },
                Reply: { $sum: { $cond: [{ $eq: [ "$combinedResult._id.type", "Reply" ] }, "$combinedResult.count", 0] } },
                Retweet: { $sum: { $cond: [{ $eq: [ "$combinedResult._id.type", "Retweet" ] }, "$combinedResult.count", 0] } }
            }
        }
    ]).exec();
      const userTwitterTypes = {};
      
      userTypeStatus1.forEach(doc => {
        if (!userTwitterTypes[doc._id]) {
          userTwitterTypes[doc._id] = { Post: 0, Reply: 0, Retweet: 0 };
        }
      
        userTwitterTypes[doc._id].Post += doc.Post;
        userTwitterTypes[doc._id].Reply += doc.Reply;
        userTwitterTypes[doc._id].Retweet += doc.Retweet;
      });
      
      userTypeStatus2.forEach(doc => {
        if (!userTwitterTypes[doc._id]) {
          userTwitterTypes[doc._id] = { Post: 0, Reply: 0, Retweet: 0 };
        }
      
        userTwitterTypes[doc._id].Post += doc.Post;
        userTwitterTypes[doc._id].Reply += doc.Reply;
        userTwitterTypes[doc._id].Retweet += doc.Retweet;
      });
    return userTwitterTypes;
  }

  async queryUserScoreStatus()
  {
    const scores1 = await this.twitterSummaryModel.aggregate([
      { $match: { userName: { $exists: true} } },
      {
        $group: {
          _id: "$userName",
          totalScore: { $sum: "$score" },
          count: { $sum: 1 }
        }
      }]).exec();
    
    // 获取第二个集合中所有用户的得分和文档数量
    const scores2 = await this.twitterSummaryArchiveModel.aggregate([
      { $match: { userName: { $exists: true} } },
      {
        $group: {
          _id: "$userName",
          totalScore: { $sum: "$score" },
          count: { $sum: 1 }
        }
      }]).exec();
    
    // 将两个集合的得分和文档数量合并，并计算每个用户的总平均分
    const userScores = {};
    
    scores1.forEach(doc => {
      if (!userScores[doc._id]) {
        userScores[doc._id] = { totalScore: 0, count: 0 };
      }
    
      userScores[doc._id].totalScore += doc.totalScore;
      userScores[doc._id].count += doc.count;
    });
    
    scores2.forEach(doc => {
      if (!userScores[doc._id]) {
        userScores[doc._id] = { totalScore: 0, count: 0 };
      }
    
      userScores[doc._id].totalScore += doc.totalScore;
      userScores[doc._id].count += doc.count;
    });
    
    Object.keys(userScores).forEach(userName => {
      const averageScore = userScores[userName].totalScore / userScores[userName].count;
      userScores[userName] = averageScore;
    });
    let sortedUserScores = Object.entries(userScores)
    .sort(([,a],[,b]) => Number(b) - Number(a))
    .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});
    return sortedUserScores;
  }
}
