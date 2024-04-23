import * as mongoose from 'mongoose';
import { timestamp } from 'rxjs';

export const EmbedingSchema = new mongoose.Schema({
  tweetId: String,
  feature: Array,
  embeddedAt: Date,
  userName: String
});