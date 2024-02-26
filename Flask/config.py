# Database configuration
import mysql.connector

# For local testing
CNX = mysql.connector.connect(
    user='root',
    password='kZhzE5GvxLTHaeKQF6VB',
    host='127.0.0.1',
    database='Bikes'
)

# For deployment
"""
 CNX = mysql.connector.connect(
    user='admin2',
    password='B!kes2JMT',
    host='bikes-database-group2.c7yki6c8g16a.eu-west-1.rds.amazonaws.com',
    database='Bikes'
)
"""

# Google Maps API Key
GOOGLE_MAPS_API_KEY = 'AIzaSyAZaEVm-iaqYgxEWMygoWmWAnxiCQwzalg'


