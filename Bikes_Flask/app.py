from flask import Flask, render_template, jsonify
from DBinterface import Link
import config

# Initialize Google Maps client and app instance
app = Flask(__name__)
app.config["MAPS_APIKEY"] = config.GOOGLE_MAPS_API_KEY

# MySQL configurations
DBconfig = config.CNX
session = Link(DBconfig)

print("Starting app...")


@app.route("/")
def index():
    session.populate_map_all()
    static_stations = session.get_static_stations()
    print(static_stations)
    return render_template('index.html', stations=static_stations, MAPS_APIKEY=app.config["MAPS_APIKEY"])


@app.route("/stations_dynamic")
def get_static_stations():
    static_stations = session.get_static_stations()
    return render_template('index.html', stations=static_stations, MAPS_APIKEY=app.config["MAPS_APIKEY"])


@app.route("/weather")
def get_weather_now():
    weather_data = session.get_weather()
    return jsonify(weather_data)


if __name__ == "__main__":
    app.run(debug=True, use_debugger=False, use_reloader=False)
