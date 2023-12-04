import * as mongoose from 'mongoose';

export const TwitterSchema = new mongoose.Schema({
  text: String,
  userName: String,
  linkToTweet: String,
  tweetEmbedCode: String,
  createAt: Date,
  type: String, // Post, Like, Retweet, Reply
  summarized: Boolean,
  retryCount: Number
});

export const TwitterUserSchema = new mongoose.Schema({}, { strict: false });