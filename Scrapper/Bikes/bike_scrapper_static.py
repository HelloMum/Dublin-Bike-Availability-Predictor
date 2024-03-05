import mysql.connector
import requests
import logging
from datetime import datetime, timezone

# Connection to the database #sql username, pass, db = sql schema. host = RDS endpoint
cnx = mysql.connector.connect(
    user='admin2',
    password='B!kes2JMT',
    host='bikes-database-group2.c7yki6c8g16a.eu-west-1.rds.amazonaws.com',
    database='Bikes'
)

# Jason fetch
API_KEY = '8e2d39566206c680b37fa532dc58214a023b6783'
CONTRACT_NAME = 'dublin'

def stations_to_db_static(cursor, place):
    utc_now = datetime.now(timezone.utc)
    formatted_utc_now = utc_now.strftime('%Y-%m-%d %H:%M:%S')

    vals = (
        place.get('number'),
        place.get('address'),
        place.get('position').get('lat'),
        place.get('position').get('lng'),
        formatted_utc_now,  # The last time we updated the API

    )

    try:
        cursor.execute(
            "INSERT INTO stations_static ("
            "    place_name, place_address, place_latitude, place_longitude, api_update"
            ")"
            "VALUES (%s, %s, %s, %s, %s)",
            vals
        )
        cnx.commit()
        print("Static data inserted successfully")
    except mysql.connector.Error as err:
        print(err.msg)
        print("Error: Maybe duplicated")


STATIONS_URL = f"https://api.jcdecaux.com/vls/v1/stations?apiKey={API_KEY}&contract={CONTRACT_NAME}"

response = requests.get(STATIONS_URL)

if response.status_code == 200:
    stations_json = response.json()
    cursor = cnx.cursor()
    print(stations_json)
    for station in stations_json:
        stations_to_db_static(cursor, station)

    cursor.close()
else:
    print(f"Failed to fetch stations. Status Code: {response.status_code}")

cnx.close()
