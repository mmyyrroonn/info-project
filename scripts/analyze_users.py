import requests

url = "https://info.myron-moshui.online/analysis/userStatus"

payload={}
headers = {}

response = requests.request("GET", url, headers=headers, data=payload).json()

def filter_low_score(data: dict):
    count = 0
    for key, value in data.items():
        if value["AverageScore"] < 5:
            print(key)
            count += 1
    print(count)

def filter_official_user(data: dict):
    count = 0
    for key, value in data.items():
        if value["AverageScore"] > 5 and value["Post"] > 20 and value["Reply"] < 5:
            print(key)
            count += 1
    print(count)

filter_official_user(response['data'])