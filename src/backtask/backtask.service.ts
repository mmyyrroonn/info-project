import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class BacktaskService {
    private readonly maxArchiveNumber = 500;
    private readonly archiveDay = 5;
    constructor(
        @InjectModel('Summary') private readonly twitterSummaryModel,
        @InjectModel('Twitter') private readonly twitterModel,
        @InjectModel('SummaryArchive') private readonly twitterSummaryArchiveModel,
        @InjectModel('TwitterArchive') private readonly twitterArchiveModel,
    ) {
    }

    @Cron(CronExpression.EVERY_HOUR)
    async tryToArchiveTwitter() {
        const archiveDate = new Date(Date.now() - this.archiveDay * 24 * 60 * 60 * 1000);
        // 查询要归档的文档
        const documentsToArchive = await this.twitterModel.find({ createAt: { $lt: archiveDate } }).limit(this.maxArchiveNumber).exec();

        // 将查询到的文档插入到归档集合中
        await this.twitterArchiveModel.insertMany(documentsToArchive);

        // 删除已归档的文档
        await this.twitterModel.deleteMany({ _id: { $in: documentsToArchive.map(doc => doc._id) } }).exec();
    }

    @Cron(CronExpression.EVERY_HOUR)
    async tryToArchiveTwitterSummary() {
        const archiveDate = new Date(Date.now() - this.archiveDay * 24 * 60 * 60 * 1000);
        // 查询要归档的文档
        const documentsToArchive = await this.twitterSummaryModel.find({ summarizedAt: { $lt: archiveDate } }).limit(this.maxArchiveNumber).exec();

        // 将查询到的文档插入到归档集合中
        await this.twitterSummaryArchiveModel.insertMany(documentsToArchive);

        // 删除已归档的文档
        await this.twitterSummaryModel.deleteMany({ _id: { $in: documentsToArchive.map(doc => doc._id) } }).exec();
    }

    // @Cron(CronExpression.EVERY_10_SECONDS)
    // async tryToUpdateDB() {
    //     console.log("start update");
    //     const documentsToUpdate = await this.twitterArchiveModel.find().exec();
    //     for (const document of documentsToUpdate) {
    //         await this.twitterArchiveModel.updateOne({ _id: document._id }, { tweetId: document.tweetId.trim(), userName: document.userName.trim() }).exec();
    //     }
    //     console.log("update finished");
    // }
}
