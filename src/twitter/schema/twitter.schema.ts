import * as mongoose from 'mongoose';

export const TwitterSchema = new mongoose.Schema({
  text: String,
  userName: String,
  linkToTweet: String,
  tweetEmbedCode: String,
  createAt: String,
  type: String,
  summarized: Boolean
});

export const TwitterUserSchema = new mongoose.Schema({}, { strict: false });