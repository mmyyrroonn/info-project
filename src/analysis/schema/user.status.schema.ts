import * as mongoose from 'mongoose';

export const UserStatusSchema = new mongoose.Schema({
  userName: String,
  postCount: Number,
  replyCount: Number,
  retweetCount: Number,
});