import mysql.connector
import requests
import logging
from datetime import datetime, timezone

API_key = '2f9e606fb12c8f3e219615414ab757ff'
# Coordinates of Dublin 53.3498° N, 6.2603° W
lat = '53.3498'
lon = '6.2603'

weather_api_url = f'https://api.openweathermap.org/data/2.5/onecall?lat={lat}&lon={lon}&appid={API_key}'

# Connection to the database
cnx = mysql.connector.connect(
    user='root',
    password='kZhzE5GvxLTHaeKQF6VB',
    host='127.0.0.1',
    database='Bikes'
)

# Set up logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")

# Log to console
handler = logging.StreamHandler()
handler.setFormatter(formatter)
logger.addHandler(handler)

# Also log to a file, useful for the cron routine
file_handler = logging.FileHandler("weather-errors.log")
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)


def store_weather_data(cursor, data):
    current_time = datetime.utcfromtimestamp(data['current']['dt']).strftime('%Y-%m-%d %H:%M:%S')

    # Extract relevant data
    temp = data['current']['temp']
    main_event = data['current']['weather'][0]['main']
    rain_hour_day = data['daily'][1]['rain'] #just daily hourly
    feels_like = data['current']['feels_like']
    humidity = data['current']['humidity']
    wind_speed = data['current']['wind_speed']
    description = data['current']['weather'][0]['description']

    # Store data in the database
    try:
        cursor.execute("\n"
                       "            INSERT INTO weather_data (\n"
                       "                main_event, rain_hour_day, timestamp, temperature, feels_like, humidity, wind_speed, description\n"
                       "            )\n"
                       "            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)\n"
                       "        ", (main_event, rain_hour_day, current_time,  temp , feels_like, humidity, wind_speed, description))
        cnx.commit()
        print("Weather data inserted successfully")
    except mysql.connector.Error as err:
        print(err.msg)
        print("Error: Maybe duplicated?")


response = requests.get(weather_api_url)

if response.status_code == 200:
    weather_data = response.json()
    cursor = cnx.cursor()
    store_weather_data(cursor, weather_data)
else:
    print(f"Failed to fetch weather data. Status code: {response.status_code}")

cursor.close()
cnx.close()
