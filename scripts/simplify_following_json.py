import json

# 读取原始JSON文件
with open('twitter-blackmoshui-following-1700570778091.json', 'r') as file:
    data = json.load(file)

# 提取需要的字段，并创建新的对象列表
new_data = [{'id': obj['id'], 'description': obj['legacy']['description'], 'followers_count': obj['legacy']['followers_count'], 'screen_name': obj['legacy']['screen_name']} for obj in data]

# 将新数据写入输出JSON文件
with open('following.json', 'w') as file:
    json.dump(new_data, file, ensure_ascii=False)
