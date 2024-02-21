from flask import Flask, render_template, jsonify
from flaskext.mysql import MySQL
import config

app = Flask(__name__)

# Initialize Google Maps client
app.config["MAPS_APIKEY"] = config.GOOGLE_MAPS_API_KEY  

# MySQL configurations
app.config['MYSQL_DATABASE_USER'] = config.DATABASE_CONFIG['user']
app.config['MYSQL_DATABASE_PASSWORD'] = config.DATABASE_CONFIG['password']
app.config['MYSQL_DATABASE_DB'] = config.DATABASE_CONFIG['database']
app.config['MYSQL_DATABASE_HOST'] = config.DATABASE_CONFIG['host']

mysql = MySQL()
mysql.init_app(app)

@app.route("/")
def index():
    stations = []
    try:    
        cursor = mysql.connect().cursor()
        cursor.execute("SELECT * FROM stations_dynamic")
        rows = cursor.fetchall() 
        for row in rows:
            stations.append({
                'number': row[0],
                'name': row[1],
                'latitude': row[2],
                'longitude': row[3],
                'title': row[1],
                'status': row[8],
                'bike_stands': row[7],
                'available_bikes': row[6]
            })
        cursor.close()
    except Exception as e:
        print(f"Error fetching data from database: {str(e)}")
        
    # Render the map.html template, passing the stations list and the Google Maps API Key
    return render_template('index.html', stations = stations, MAPS_APIKEY=app.config["MAPS_APIKEY"])

@app.route("/weather")
def weather():
    weather_data = {}
    try:    
        cursor = mysql.connect().cursor()
        cursor.execute("SELECT * FROM weather_data ORDER BY timestamp DESC LIMIT 1")
        row = cursor.fetchone()
        if row:
            weather_data = {
                'main_event': row[0],
                'rain_hour_day': row[1],
                'timestamp': row[2],
                'temperature': row[3],
                'feels_like': row[4],
                'humidity': row[5],
                'wind_speed': row[6],
                'description': row[7]
            }
        cursor.close()
    except Exception as e:
        print(f"Error fetching data from database: {str(e)}")
        
    return jsonify(weather_data)

if __name__ == "__main__":
    app.run(debug=True)