from flask import Flask, render_template, jsonify
from DBinterface import Link
import config

# Initialize Google Maps client and app instance

# MySQL configurations


print("Starting app...")

app = Flask(__name__)
app.config["MAPS_APIKEY"] = config.GOOGLE_MAPS_API_KEY
DBconfig = config.CNX


with app.app_context():
    print ("App context started")
    database = Link(DBconfig)
    dynamic_last = database.get_dynamic_all_stations_last()
    static_all = database.get_static_all_stations_all()
    weather_last = database.get_weather_last()
    # Checking there is no issues
    # Checking there is no issues
    print(dynamic_last)
    print(static_all)
    print(weather_last)


@app.route("/")
def index():
    static_all
    return render_template('index.html', stations=static_all, MAPS_APIKEY=app.config["MAPS_APIKEY"])


@app.route("/stations_dynamic")
def get_static_stations():
    return jsonify(static_all)


@app.route("/weather")
def get_weather_now():
    return jsonify(weather_last)


if __name__ == "__main__":
    app.run(debug=True, use_debugger=True, use_reloader=False)
