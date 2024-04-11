# Database configuration
import mysql.connector

# For local testing
CNX = mysql.connector.connect(
    user='root',
    password='kZhzE5GvxLTHaeKQF6VB',
    host='127.0.0.1',
    database='Bikes'
)
"""
# For deployment
CNX = mysql.connector.connect(
    user='root',
    password='',
    host='127.0.0.1',
    database='bikes'
)"""

# Google Maps API Key
GOOGLE_MAPS_API_KEY = 'AIzaSyAZaEVm-iaqYgxEWMygoWmWAnxiCQwzalg'


