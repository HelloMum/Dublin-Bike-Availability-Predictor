# Database configuration
import mysql.connector

"""# For local testing
CNX = mysql.connector.connect(
    user='root',
    password='kZhzE5GvxLTHaeKQF6VB',
    host='127.0.0.1',
    database='Bikes'
)"""

# For deployment
CNX = mysql.connector.connect(
    user='admin',
    password='kZhzE5GvxLTHaeKQF6VB',
    host='database-bikes.cvuo0aug0fzn.eu-north-1.rds.amazonaws.com',
    database='Bikes'
)

# Google Maps API Key
GOOGLE_MAPS_API_KEY = 'AIzaSyAZaEVm-iaqYgxEWMygoWmWAnxiCQwzalg'

WEATHER_API_KEY = 'b1aedb14183d55850347826bc9afe2bb'