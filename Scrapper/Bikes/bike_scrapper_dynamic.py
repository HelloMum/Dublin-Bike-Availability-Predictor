import mysql.connector
import requests
import logging
from datetime import datetime, timezone

# Connection to the database
cnx = mysql.connector.connect(
    user='root',
    password='kZhzE5GvxLTHaeKQF6VB',
    host='127.0.0.1',
    database='Bikes'
)

# Jason fetch
API_KEY = '8e2d39566206c680b37fa532dc58214a023b6783'
CONTRACT_NAME = 'dublin'

# Set up logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")

# Log to console
handler = logging.StreamHandler()
handler.setFormatter(formatter)
logger.addHandler(handler)

# Also log to a file, useful for the cron routine
file_handler = logging.FileHandler("cpy-errors.log")
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)


def stations_to_db_dynamic(cursor, station):
    utc_now = datetime.now(timezone.utc)
    formatted_utc_now = utc_now.strftime('%Y-%m-%d %H:%M:%S')  # Remove the last 3 digits to get milliseconds
    last_update_timestamp = station.get('last_update') / 1000.0
    last_update_datetime = datetime.utcfromtimestamp(last_update_timestamp)


    vals = (
        station.get('number'),
        station.get('name'),
        station.get('banking'),
        station.get('bonus'),
        station.get('status'),
        last_update_datetime,  # Use the converted datetime from Unix
        formatted_utc_now,  # The last time we updated the API
        station.get('available_bikes'),
        station.get('available_bike_stands'),
        station.get('bike_stands'),
    )

    try:
        cursor.execute(
            "INSERT INTO stations_dynamic ("
            "    number, name, banking, bonus, status, last_update, api_update,"
            "    available_bikes, available_bike_stands, bike_stands"
            ")"
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
            vals
        )
        cnx.commit()
        print("Dynamic data inserted successfully")
    except mysql.connector.Error as err:
        print(err.msg)
        print("Error: Maybe duplicated")


STATIONS_URL = f"https://api.jcdecaux.com/vls/v1/stations?apiKey={API_KEY}&contract={CONTRACT_NAME}"

response = requests.get(STATIONS_URL)

if response.status_code == 200:
    stations_json = response.json()
    cursor = cnx.cursor()
    for station in stations_json:
        stations_to_db_dynamic(cursor, station)

    cursor.close()
else:
    print(f"Failed to fetch stations. Status Code: {response.status_code}")

cnx.close()
