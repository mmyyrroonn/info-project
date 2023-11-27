import * as mongoose from 'mongoose';

export const TwitterSchema = new mongoose.Schema({
  text: String,
  userName: String,
  linkToTweet: String,
  tweetEmbedCode: String,
  createAt: String,
  type: String
});

export const TwitterUserSchema = new mongoose.Schema({}, { strict: false });