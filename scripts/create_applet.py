# selenium 4
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from dotenv import load_dotenv
# 加载 .env 文件
load_dotenv()

# 使用环境变量
import os
import time


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

def open_ifttt():
    driver.get(ifttt_address)
    time.sleep(5)


def click(xpath, max_retry = 5):
    while(max_retry):
        try:
            check_box = driver.find_element(By.XPATH, xpath)
            check_box.click()
            print("click successfully")
            time.sleep(3)
            return
        except:
            time.sleep(1)
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
            time.sleep(3)
            return
        except:
            time.sleep(1)
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
            time.sleep(3)
            return
        except:
            time.sleep(1)
            max_retry = max_retry - 1
            continue
    print("input failed")

def init_click_create():
    click("//html/body/header/div/section[2]/a[4]")
    time.sleep(3)

def add_trigger(user_name):
    # click add trigger
    click("//html/body/main/div/section/section/section[1]/button")
    # input twitter
    input("//html/body/main/div/section/div/div[2]/input", "twitter")
    # click twitter
    click("//html/body/main/div/section/div/ul/li/a/div/img")
    # click specific user
    click("//html/body/main/div/section/div/ul/li[8]/a/span[2]")
    # input user name
    input("//html/body/main/div/section/div/form/div/ul/li[2]/span[2]/div/div/div/textarea", user_name)
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

def click_continue(user_name):
    # click continue
    click("//html/body/main/div/section/section[2]/button")
    # input name
    input("//html/body/main/div/section/div[1]/div[2]/div/div[1]/textarea", "tweet@"+user_name)
    # click finish action
    click("//html/body/main/div/section/div[3]/button")

def next_create():
    # click create
    click("//html/body/div[1]/header/div/section[2]/a[4]")

def get_current_user_url():
    return driver.current_url


# open_ifttt()
# init_click_create()
# add_trigger(test_username)
# add_action()
# click_continue(test_username)
# print(get_current_user_url())
# next_create()
time.sleep(5)