import * as mongoose from 'mongoose';
import { timestamp } from 'rxjs';

export const TwitterSummarySchema = new mongoose.Schema({
  linkToTweet: String,
  keyWords: [String],
  score: Number,
  summarizedAt: Date
});