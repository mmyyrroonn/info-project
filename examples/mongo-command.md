db.twitterarchives.updateMany(
  {}, // 空对象{}表示匹配所有文档
  { $rename: { 'linkToTweet': 'tweetId' } } // 将"firstname"重命名为"first_name"
);