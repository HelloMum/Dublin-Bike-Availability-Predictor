# Program to fetch weather data and insert it onto the DB.
# Find more information about the weather  codes in -> https://openweathermap.org/weather-conditions#Weather-Condition-Codes-2

import mysql.connector
import requests
import logging
from datetime import datetime, timezone
import sys

API_key = 'b1aedb14183d55850347826bc9afe2bb'
# Coordinates of Dublin 53.3498° N, 6.2603° W This is negative
lat = '53.3498'
lon = '-6.2603'

weather_api_url = f'https://api.openweathermap.org/data/2.5/onecall?lat={lat}&lon={lon}&appid={API_key}&units=metric'

# Connection to the database #sql username, pass, db = sql schema. host = RDS endpoint
cnx = mysql.connector.connect(
    user='admin2',
    password='B!kes2JMT',
    host='bikes-database-group2.c7yki6c8g16a.eu-west-1.rds.amazonaws.com',
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
response = requests.get(weather_api_url)


def store_weather_data(cursor, data):
    current_time = datetime.utcfromtimestamp(data['current']['dt']).strftime('%Y-%m-%d %H:%M:%S')

    # Extract relevant data
    # ~  We carefully take the data as some element might not be present on the JSON
    try:
        temp = data['current']['temp']
    except KeyError:  # If the current temp is not present it will send 999 to indicate wrong info
        print("No temp skipping")
        logging.debug("No temp skipping")
        temp = 0

    try:
        main_event = data['current']['weather'][0]['main']
    except KeyError:  # If in the hour there is 0 rain it won't show on the JSON
        print("No main event, skipping")
        logging.debug("No main event, skipping")
        main_event = "Not defined"

    try:
        rain_hour_day = data['hourly'][0]['rain']['1h']  # Hourly rain expected
    except KeyError:  # If in the hour there is 0 rain it won't show on the JSON
        print("No hourly rain, skipping")
        logging.debug("No hourly rain, skipping")
        rain_hour_day = 0

    try:  # I have not seen these not been present but I will add them just in case
        feels_like = data['current']['feels_like']
    except KeyError:  # If in the hour there is 0 rain it won't show on the JSON
        print("No feels like, skipping")
        logging.debug("No feels like, skipping")
        feels_like = 0

    try:
        humidity = data['current']['humidity']
    except KeyError:  # If in the hour there is 0 rain it won't show on the JSON
        print("No humidity, skipping")
        logging.debug("No humidity, skipping")
        humidity = 0

    try:
        wind_speed = data['current']['wind_speed']
    except KeyError:  # If in the hour there is 0 rain it won't show on the JSON
        print("No wind speed, skipping")
        logging.debug("No wind speed, skipping")
        wind_speed = 0

    try:
        description = data['current']['weather'][0]['description']
    except KeyError:  # If in the hour there is 0 rain it won't show on the JSON
        print("No description, skipping")
        logging.debug("No description, skipping")
        rain_hour_day = "No description"

    # Store data in the database
    try:
        cursor.execute("\n"
                       "            INSERT INTO weather_data (\n"
                       "                main_event, rain_hour_day, timestamp, temperature, feels_like, humidity, wind_speed, description\n"
                       "            )\n"
                       "            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)\n"
                       "        ",
                       (main_event, rain_hour_day, current_time, temp, feels_like, humidity, wind_speed, description))
        cnx.commit()
        print("Weather data inserted successfully")
        cnx.close()
        sys.exit()

    except mysql.connector.Error as err:
        print(err.msg)
        print("Error: Maybe duplicated?")
        cnx.close()
        sys.exit()

    finally:
        cnx.close()
        sys.exit()


if response.status_code == 200:
    weather_data = response.json()
    cursor = cnx.cursor()
    store_weather_data(cursor, weather_data)
else:
    print(f"Failed to fetch weather data. Status code: {response.status_code}")
    print("Exiting...")
    cnx.close()
    sys.exit()

print("Exiting...")

sys.exit()
