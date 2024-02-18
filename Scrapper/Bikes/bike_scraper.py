# This program needs to be added in the crontab in 5 minutes interval
# Command into the aws instance ->> # crontab 5 * * * * python /home/bike_api_test.py

import requests
import json
import traceback
import datetime 
import sqlalchemy as db


# Constants
API_KEY = '8e2d39566206c680b37fa532dc58214a023b6783'  ### Just for the weather data
CONTRACT_NAME = 'dublin'  
STATIONS = "https://api.jcdecaux.com/vls/v1/stations"

#### SQL Code #### 
DB_URI = mysql+pymysql://admin2:B!kes2JMT@ec2-18-201-241-79.eu-west-1.compute.amazonaws.com/bikesdatabasegroup2
engine = create_engine(DB_URI, echo = True)


def write_to_file(text):
    with open("data/bikes_{}".format(now).replace(" ", "_"), "w") as f:
        f.write(r.text)

def stations_to_db(text):
    stations = json.loads(text)
    print(type(stations), len(stations))
    for station in stations:
        print(station)
        vals = (station.get('address'), 
        int(station.get('banking'))), 
        station.get('bike_stands'), 
        int(station.get('bonus')), 
        station.get('contract_name'), 
        station.get('name'),
        station.get('position').get('lat'), 
        station.get('position').get('lng'), 
        station.get('status'), 
        int(station.get('availabilities').get('bikes')),
        int(station.get('availabilities').get('stands')),
        int(station.get('availabilities').get('mechanicalBikes')), 
        int(station.get('availabilities').get('electricalBikes')),
        
        engine.execute("insert into station values(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)", vals)
        break
    return

# Function to get stations data
def main ():
    try:
        now = datetime.datetime.now()
        r = requests.get(STATIONS, paramsq = {"apiKey": API_KEY, "contract": CONTRACT_NAME})
        print(r, now)
        write_to_file(r.text)
        stations_to_db(r.text)

    except:
        # if there is any problem, print the traceback
        print(traceback.format_exc())
        if engine is None:
            return

