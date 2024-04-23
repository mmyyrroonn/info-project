import { DataType } from "@zilliz/milvus2-sdk-node";

// define schema
const dim = 1536;
export const twitterMilvusSchema = [
  {
    name: `tweet_id`,
    description: `tweet id`,
    data_type: DataType.VarChar,
    max_length: 255,
    is_primary_key: true,
    autoID: false,
  },
  {
    name: `create_at`,
    description: `tweet's timestamp of creation`,
    data_type: DataType.Int64,
  },
  {
    name: `score`,
    description: `tweet's scpre to evaluate the importance`,
    data_type: DataType.Int8,
  },
  {
    name: `openai_small_feature`,
    description: `open ai tweet feature`,
    data_type: DataType.FloatVector,
    dim: dim,
  },
];
