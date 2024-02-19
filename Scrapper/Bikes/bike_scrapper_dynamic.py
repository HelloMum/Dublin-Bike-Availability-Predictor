import mysql.connector
import requests

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

def create_dynamic_table(cursor):
    try:
        cursor.execute("\n"
                       "            CREATE TABLE IF NOT EXISTS stations_dynamic (\n"
                       "                id INT AUTO_INCREMENT PRIMARY KEY,\n"
                       "                number INT,\n"
                       "                contract_name VARCHAR(255),\n"
                       "                name VARCHAR(255),\n"
                       "                address VARCHAR(255),\n"
                       "                latitude DECIMAL(10, 6),\n"
                       "                longitude DECIMAL(10, 6),\n"
                       "                banking BOOLEAN,\n"
                       "                bonus BOOLEAN,\n"
                       "                status VARCHAR(255),\n"
                       "                last_update TIMESTAMP,\n"
                       "                available_bikes INT,\n"
                       "                available_bike_stands INT,\n"
                       "                bike_stands INT\n"
                       "            )\n"
                       "        ")
        cnx.commit()
        print("Table 'stations_dynamic' created successfully.")
    except mysql.connector.Error as err:
        print(err.msg)


def stations_to_db_dynamic(cursor, station):
    vals = (
        station.get('number'),
        station.get('contract_name'),
        station.get('name'),
        station.get('address'),
        station.get('position').get('latitude'),
        station.get('position').get('longitude'),
        station.get('banking'),
        station.get('bonus'),
        station.get('status'),
        station.get('last_update'),
        station.get('available_bikes'),
        station.get('available_bike_stands'),
        station.get('bike_stands'),
    )

    try:
        cursor.execute("\n"
                       "            INSERT INTO stations_dynamic (\n"
                       "                number, contract_name, name, address, latitude, longitude, banking, bonus,\n"
                       "                status, last_update, available_bikes, available_bike_stands, bike_stands\n"
                       "            )\n"
                       "            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)\n"
                       "        ", vals)
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
    create_dynamic_table(cursor)  # Create table if not exists

    for station in stations_json:
        stations_to_db_dynamic(cursor, station)

    cursor.close()
else:
    print(f"Failed to fetch stations. Status Code: {response.status_code}")

cnx.close()
