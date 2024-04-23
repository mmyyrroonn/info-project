import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MilvusClient, DataType } from "@zilliz/milvus2-sdk-node";
import { twitterMilvusSchema } from "src/milvus/schema/twitter.schema"
import { Cron, CronExpression } from '@nestjs/schedule';


@Injectable()
export class MilvusService {
    private readonly milvusClient;
    private readonly latest_twitter_collection_name = `latestTwitter`;

    constructor(
        private readonly configService: ConfigService
    ) {
        const milvusEndpoint = this.configService.get('milvusEndpoint');
        this.milvusClient = new MilvusClient(milvusEndpoint);
    }

    async initLatestTwitterCollection() {
        const res = await this.milvusClient.hasCollection({ collection_name: this.latest_twitter_collection_name });
        if(res.value) {
            console.log("Already exist, skip create it");
            return;
        }
        console.log("Not exist and create it");
        await this.milvusClient.createCollection({
            collection_name: this.latest_twitter_collection_name,
            description: `store the latest twitters`,
            fields: twitterMilvusSchema,
        });

        await this.milvusClient.createIndex({
            collection_name: this.latest_twitter_collection_name,
            field_name: "openai_small_feature",
            index_name: "openai_small_feature_index",
            index_type: "HNSW",
            params: { efConstruction: 10, M: 4 },
            metric_type: "L2",
        });

        await this.milvusClient.loadCollectionSync({
            collection_name: this.latest_twitter_collection_name,
        });
    }

    async insertNewTweetIntoLatest(tweetId, createAt, score, feature)
    {
        const data = [
            {
                "tweet_id": tweetId,
                "create_at": createAt.getTime(),
                "score": score,
                "openai_small_feature": feature
            }
        ];
        await this.milvusClient.insert({
            collection_name: this.latest_twitter_collection_name,
            data
        })
    }

    @Cron(CronExpression.EVERY_HOUR)
    async removeOutdatedTwitter(){
        const daysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000
        await this.milvusClient.delete({
            collection_name: this.latest_twitter_collection_name,
            filter: `create_at < ${daysAgo}`
        })
    }

    async queryRelatedTwitter(query_feature, limit){
        const res = await this.milvusClient.search({
            // required
            collection_name: this.latest_twitter_collection_name,
            data: query_feature,
            // optionals
            params: { nprobe: 64 }, // optional, specify the search parameters
            limit: limit, // optional, specify the number of nearest neighbors to return
          });
          return res.results;
    }
}
