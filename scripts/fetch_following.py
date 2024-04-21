import requests
import json

url = "https://twitter-api45.p.rapidapi.com/following.php"

screen_name = "BTC521"

querystring = {"screenname": screen_name}

headers = {
	"X-RapidAPI-Key": "xxx your api",
	"X-RapidAPI-Host": "twitter-api45.p.rapidapi.com"
}

following = []
cursor = None
filename = screen_name+'following.json'
while True:
    if cursor:
        querystring['cursor'] = cursor
    response = requests.get(url, headers=headers, params=querystring).json()
    if 'more_users' in response and response['more_users']:
        new_following = response['following']  # Replace 'data' with the actual key containing user data
        following.extend(new_following)

        # Write/append the new following data to a JSON file
        with open(filename, 'w') as f:
            json.dump(following, f, indent=4)

        # Update the cursor for the next iteration
        cursor = response['next_cursor']
    else:
        # No more users or no cursor provided, exit the loop
        break
print("Finished retrieving following data.")


    
