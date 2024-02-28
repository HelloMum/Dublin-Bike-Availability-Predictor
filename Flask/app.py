from flask import Flask, render_template, jsonify
from DBinterface import Link
import config

# Initialize Google Maps client and app instance
app = Flask(__name__)
app.config["MAPS_APIKEY"] = config.GOOGLE_MAPS_API_KEY

# MySQL configurations
DBconfig = config.CNX

print("Starting app...")


@app.route("/")
def index():
    # Create an instance of Link
    with Link(DBconfig) as link:
        stations_static = link.get_static_all_stations()
    return render_template('index.html', stations=stations_static, MAPS_APIKEY=app.config["MAPS_APIKEY"])


@app.route("/stations_dynamic")
def get_static_stations():
    # Create an instance of Link
    with Link(DBconfig) as link:
        stations_static = link.get_static_all_stations()
    return stations_static


@app.route("/weather")
def get_weather_now():
    with Link(DBconfig) as link:
        weather_data = link.get_weather()
    return weather_data


if __name__ == "__main__":
    app.run(debug=True, use_debugger=True, use_reloader=False)
