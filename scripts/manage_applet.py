# selenium 4
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from selenium.webdriver.common.keys import Keys
from dotenv import load_dotenv
from tinydb import TinyDB, Query
# 加载 .env 文件
load_dotenv()

# 使用环境变量
import os
import time
import random
import requests
from selenium.common.exceptions import (NoSuchElementException,
                                        TimeoutException,
                                        ElementClickInterceptedException,
                                        WebDriverException)

adspower_address = "http://local.adspower.net:50325"
class AdsPowerChromeDriver:
    def __init__(self, user_id, selemium = None, driver_path = None) -> None:
        self.user_id = user_id
        self.selemium = selemium
        self.driver_path = driver_path
        self.driver = None

    def start(self):
        if(self.selemium != None and self.driver_path != None):
            print("Already started and skip it")
        url = adspower_address + "/api/v1/browser/start"
        params = {
            "user_id": self.user_id
        }
        response = requests.get(url, params=params)

        self.selemium = response.json()['data']['ws']['selenium']
        self.driver_path = response.json()['data']['webdriver']
        time.sleep(5)

    def close(self):
        url = adspower_address + "/api/v1/browser/stop"
        params = {
            "user_id": self.user_id
        }
        _response = requests.get(url, params=params)
        self.selemium = None
        self.driver_path = None
        print("Close it")

    def get_status(self):
        url = adspower_address + "/api/v1/browser/active"
        params = {
            "user_id": self.user_id
        }
        response = requests.get(url, params=params).json()
        isSuccess = response['code'] == 0
        isActive = isSuccess and response['data']['status'] == "Active"
        return isSuccess, isActive

    def connect(self):
        chrome_options = webdriver.ChromeOptions()
        chrome_options.add_experimental_option("debuggerAddress", self.selemium)
        service = ChromeService(self.driver_path)
        self.driver = webdriver.Chrome(service=service, options=chrome_options)
        return self.driver
    
chrome = AdsPowerChromeDriver("jdbmn03")
chrome.start()
driver = chrome.connect()

ifttt_address = "https://ifttt.com/explore"
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
    random_sleep(2)


def click(xpath, max_retry = 5):
    while(max_retry):
        try:
            check_box = driver.find_element(By.XPATH, xpath)
            check_box.click()
            random_sleep(1)
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
            for _ in range(len(check_input.get_attribute('value'))):
                check_input.send_keys(Keys.BACKSPACE)
            check_input.send_keys(content)
            print("input successfully")
            random_sleep(1)
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
            random_sleep(1)
            return
        except:
            random_sleep(1)
            max_retry = max_retry - 1
            continue
    print("input failed")

def init_click_create():
    click("//html/body/header/div[1]/section[2]/a[3]")
    random_sleep(3)

def add_trigger(user_handler):
    # click add trigger
    click("//html/body/main/div/section/section[2]/section/section[1]/button")
    # input twitter
    input("//html/body/main/div/section/div/div[2]/input", "twitter")
    # click twitter
    click("//html/body/main/div/section/div/ul/li/a/div/img")
    # click specific user
    click("//html/body/main/div/section/div/ul/li[8]/a/span[2]")
    # select blackmoshui
    select("//html/body/main/div/section/div/form/div/ul/li[1]/span[2]/div/select", "425403857")
    # input user name
    input("//html/body/main/div/section/div/form/div/ul/li[2]/span[2]/div/div/div/textarea", user_handler)
    # click create trigger
    click("//html/body/main/div/section/div/form/div/div/input")

def add_action():
    # click add action
    click("//html/body/main/div/section/section[2]/section/section[2]/button")
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
    click("//html/body/main/div/section/section[2]/section[2]/button")
    # input name
    input("//html/body/main/div/section/div[1]/div[2]/div/div[1]/textarea", "tweet@"+user_handler)
    # click finish action
    click("//html/body/main/div/section/div[2]/button")

def next_create():
    # click create
    click("//html/body/div[1]/header/div[1]/section[2]/a[3]")

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
        rst["isArchived"] = False
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

def check_element_content(driver, xpath: str, content: str, max_wait_time: int) -> bool:
    end_time = time.time() + max_wait_time
    while True:
        try:
            # Find the element using the provided XPath
            element = driver.find_element('xpath', xpath)
            # If the element's text matches the expected content, return True
            if content in element.text:
                return True
        except NoSuchElementException:
            # If the element is not found, we'll wait and retry
            pass
        
        # Check if the timeout has been reached
        if time.time() > end_time:
            break
        
        # Wait for 1 second before trying again
        time.sleep(1)
    
    # If the element was not found or content did not match within the max_wait_time, return False
    return False

def check_status_and_connected():
    open_ifttt()
    for item in db.all():
        url = item["url"]
        if item.get("status", "disConnect") == "Connected":
            print("{} already connected".format(item["name"]))
            continue
        open_url(url)
        if check_element_content(driver, "/html/body/main/div[1]/div/div[1]/div/div[3]/div/span/div/div", "Connect", 5):
            click("//html/body/main/div[1]/div/div[1]/div/div[3]")
            # select("//html/body/main/div/div/div[2]/div[2]/form/section/div[1]/div[2]/div/ul/li[1]/div[2]/div/select", "425403857")
            # _ = check_element_content(driver, "/html/body/main/div/div/div[2]/div[5]/div/button", "Save", 10)
            # click("//html/body/main/div/div/div[2]/div[5]/div/button")
            if check_element_content(driver, "/html/body/main/div[1]/div/div[1]/div/div[3]/div/span/div/div", "Connected", 10):
                print("{} connected done!!!!!".format(item["name"]))
                item["status"] = "Connected"
                User = Query()
                db.update(item, User.name==item["name"])
                continue
        if check_element_content(driver, "/html/body/main/div[1]/div/div[1]/div/div[3]/div/span/div/div", "Connected", 5):
            print("{} already connected".format(item["name"]))
            item["status"] = "Connected"
            User = Query()
            db.update(item, User.name==item["name"])
            continue

def update_twitter_handler():
    open_ifttt()
    count = 0
    for item in db.all():
        url = item["url"].split("-")[0]+"/edit"
        open_url(url)
        if check_element_content(driver, "/html/body/main/div/section/section[2]/section[1]/section[1]/div[1]/span[2]", "blackmoshui", 5):
            continue
        if check_element_content(driver, "/html/body/main/div/section/section[2]/section[1]/section[1]/div[1]/span[2]", "ifriend1999", 10):
            click("//html/body/main/div/section/section[2]/section[1]/section[1]/div[2]/button[1]")
            time.sleep(1)
            select("//html/body/main/div/section/div/form/div/ul/li[1]/span[2]/div/select", "425403857")
            click("//html/body/main/div/section/div/form/div/div/input")
            if check_element_content(driver, "/html/body/main/div/section/div/form/div/ul/li[2]/span[2]/span/span", "is not a", 3):
                YourSelection=Query()
                db.remove(YourSelection.name == item["name"])
                continue
            click("//html/body/main/div/section/section[2]/section[2]/button")
            if check_element_content(driver, "/html/body/main/div[1]/div/div[1]/div/div[3]/div/span/div/div", "Connected", 10):
                print("Change success")
        count += 1
        if (count > 300):
            break
create_applet()
random_sleep(5)