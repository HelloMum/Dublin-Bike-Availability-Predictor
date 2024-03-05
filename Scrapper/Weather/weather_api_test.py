import requests
import json
# Please don't over use my API key
API_key = '2f9e606fb12c8f3e219615414ab757ff'
# Coordinates of Dublin 53.3498° N, 6.2603° W
lat = '53.3498'
lon = '6.2603'

url = f'https://api.openweathermap.org/data/2.5/onecall?lat={lat}&lon={lon}&appid={API_key}'
r = requests.get(url)

data = r.json()

formatted_json = json.dumps(data, sort_keys=True, indent=4)

print(formatted_json)
