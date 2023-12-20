# selenium 4
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from dotenv import load_dotenv
from tinydb import TinyDB, Query
# 加载 .env 文件
load_dotenv()

# 使用环境变量
import os
import time
import random


options = Options()
chrome_options = webdriver.ChromeOptions()
chrome_options.add_experimental_option("debuggerAddress", "127.0.0.1:11247")
driver_path = 'F:\\Manta Wallet\\chromedriver.exe'
service = ChromeService(driver_path)
driver = webdriver.Chrome(service=service, options=chrome_options)

ifttt_address = "https://ifttt.com/explore"
test_username = "yiqifacai"
request_url = os.getenv("apiEndpoint")
request_body = '''{
  "text": " <<<{{Text}}>>>",
  "userName": " <<<{{UserName}}>>>",
  "linkToTweet": " <<<{{LinkToTweet}}>>>",
  "tweetEmbedCode": " <<<{{TweetEmbedCode}}>>>",
  "createAt": " <<<{{CreatedAt}}>>>"
}'''
db = TinyDB('ifttt.json')

def random_sleep(duration):
    percentage = 0.2 # 20%
    range_value = duration * percentage
    min_duration = duration - range_value
    max_duration = duration + range_value
    random_duration = round(random.uniform(min_duration, max_duration), 2)
    time.sleep(random_duration)


def open_ifttt():
    driver.get(ifttt_address)
    random_sleep(5)

def open_url(url):
    driver.get(url)
    random_sleep(10)


def click(xpath, max_retry = 5):
    while(max_retry):
        try:
            check_box = driver.find_element(By.XPATH, xpath)
            check_box.click()
            print("click successfully")
            random_sleep(3)
            return
        except:
            random_sleep(1)
            max_retry = max_retry - 1
            continue
    print("click failed")

def input(xpath, content, max_retry = 5):
    while(max_retry):
        try:
            check_input = driver.find_element(By.XPATH, xpath)
            check_input.clear()
            check_input.send_keys(content)
            print("input successfully")
            random_sleep(3)
            return
        except:
            random_sleep(1)
            max_retry = max_retry - 1
            continue
    print("input failed")

def select(xpath, option_value, max_retry = 5):
    while(max_retry):
        try:
            select_element = driver.find_element(By.XPATH, xpath)
            select = Select(select_element)
            select.select_by_value(option_value)
            print("select successfully")
            random_sleep(3)
            return
        except:
            random_sleep(1)
            max_retry = max_retry - 1
            continue
    print("input failed")

def init_click_create():
    click("//html/body/header/div/section[2]/a[4]")
    random_sleep(3)

def add_trigger(user_handler):
    # click add trigger
    click("//html/body/main/div/section/section/section[1]/button")
    # input twitter
    input("//html/body/main/div/section/div/div[2]/input", "twitter")
    # click twitter
    click("//html/body/main/div/section/div/ul/li/a/div/img")
    # click specific user
    click("//html/body/main/div/section/div/ul/li[8]/a/span[2]")
    # input user name
    input("//html/body/main/div/section/div/form/div/ul/li[2]/span[2]/div/div/div/textarea", user_handler)
    # click create trigger
    click("//html/body/main/div/section/div/form/div/div/input")

def add_action():
    # click add action
    click("//html/body/main/div/section/section/section[2]/button")
    # input webhook
    input("//html/body/main/div/section/div/div[2]/input", "webhooks")
    # click webhook
    click("//html/body/main/div/section/div/ul/li/a/div")
    # click make a web request
    click("//html/body/main/div/section/div/ul/li[1]/a/span[2]")
    # input url
    input("//html/body/main/div/section/div/form/div/ul/li[1]/span[2]/div/div/div[1]/textarea", request_url)
    # select post
    select("//html/body/main/div/section/div/form/div/ul/li[2]/span[2]/div/select", "POST")
    # select json
    select("//html/body/main/div/section/div/form/div/ul/li[3]/span[2]/div/select", "application/json")
    # input body
    input("//html/body/main/div/section/div/form/div/ul/li[5]/span[2]/div/div/div[1]/textarea", request_body)
    # click create action
    click("//html/body/main/div/section/div/form/div/div/input")

def finish_create(user_handler):
    # click continue
    click("//html/body/main/div/section/section[2]/button")
    # input name
    input("//html/body/main/div/section/div[1]/div[2]/div/div[1]/textarea", "tweet@"+user_handler)
    # click finish action
    click("//html/body/main/div/section/div[3]/button")

def next_create():
    # click create
    click("//html/body/div[1]/header/div/section[2]/a[4]")

def get_current_user_url():
    return driver.current_url

def update_db(user_handler):
    curr_url = get_current_user_url()
    ifttt_name = "tweet@" + user_handler
    db.insert({"name": ifttt_name, "url": curr_url, "handler": user_handler})

def already_created(user_handler):
    User = Query()
    result = db.search(User.handler == user_handler)
    if(len(result) != 0):
        return True
    return False

def check_and_fetch_url(user_handler):
    User = Query()
    result = db.search(User.handler == user_handler)
    if(len(result) != 0):
        rst = result[0]
        if "isArchived" in rst.keys():
            if rst["isArchived"] == True:
                return None
        rst["isArchived"] = True
        db.update(rst, User.name==rst["name"])
        return rst["url"]
    return None

def fetch_following_handler():
    with open('following', 'r') as file:
        lines = file.readlines()
    lines_list = [line.strip() for line in lines]
    return lines_list

def fetch_archive_handler():
    with open('archive', 'r') as file:
        lines = file.readlines()
    lines_list = [line.strip() for line in lines]
    return lines_list

def click_archive_confirm():
    # 点击弹窗的确认按钮
    alert = driver.switch_to.alert
    alert.accept()
    random_sleep(5)

def archive_page():
    # click archive
    click("//html/body/main/div[1]/div/div[7]/a")
    click_archive_confirm()

def create_applet():
    handler_list = fetch_following_handler()
    open_ifttt()
    init_click_create()
    for user_handler in handler_list:
        if(already_created(user_handler)):
            print("Already created for {}", user_handler)
            continue
        print("starting for {}", user_handler)
        add_trigger(user_handler)
        add_action()
        finish_create(user_handler)
        random_sleep(4)
        update_db(user_handler)
        next_create()
    db.close()

def archive_applet():
    handler_list = fetch_archive_handler()
    open_ifttt()
    for user_handler in handler_list:
        url = check_and_fetch_url(user_handler)
        if url is None:
            print("Already archived for {}", user_handler)
            continue
        open_url(url)
        archive_page()

create_applet()
random_sleep(5)