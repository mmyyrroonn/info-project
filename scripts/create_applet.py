# selenium 4
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
import time

options = Options()

driver = webdriver.Chrome(service=ChromeService(ChromeDriverManager().install()), options=options)

ifttt_address = "https://ifttt.com/explore"

def open_ifttt():
    driver.get(ifttt_address)


time.sleep(60)

open_ifttt()