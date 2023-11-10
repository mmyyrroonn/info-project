import * as mongoose from 'mongoose';

export const TwitterSummarySchema = new mongoose.Schema({
  linkToTweet: String,
  keyWords: [String],
  score: Number
});