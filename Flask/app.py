from urllib import request

import pandas as pd
from flask import Flask, render_template, jsonify
from DBinterface import Link
import config
import joblib

# Initialize Google Maps client and app instance

# MySQL configurations


print("Starting app...")

app = Flask(__name__)
app.config["MAPS_APIKEY"] = config.GOOGLE_MAPS_API_KEY
DBconfig = config.CNX


with app.app_context():
    svm_regressor = joblib.load('svm_regressor_model.pkl')
    print ("App context started")
    database = Link(DBconfig)
    dynamic_last = database.get_dynamic_all_stations_last()
    static_all = database.get_static_all_stations_all()
    weather_last = database.get_weather_last()

    # Checking there are no issues
    print(dynamic_last)
    print(static_all)
    print(weather_last)



@app.route('/predict', methods=['POST'])
def predict():
    # Get the ID from the JSON data
    id = request.json.get('id')

    # Print the received ID in the console
    print("Received ID:", id)

    data = {'id': id, 'number': 1, 'day_of_week': 1, 'hour_per_day': 16, 'rain_hour_day': 1, 'temperature': 13, 'wind_speed': 2, 'available_bike_stands': 30}

    # Sample input data for prediction
    input_data = pd.DataFrame([data])

    # Make prediction
    prediction = svm_regressor.predict(input_data)

    # Return prediction as JSON response
    return jsonify({'prediction': prediction.tolist()})



@app.route("/")
def index():
    static_all
    return render_template('index.html', stations=static_all, MAPS_APIKEY=app.config["MAPS_APIKEY"])


@app.route("/stations_dynamic")
def get_dynamic_stations():
    return jsonify(dynamic_last)

@app.route("/stations_static")
def get_static_stations():
    return jsonify(static_all)

@app.route("/weather")
def get_weather_now():
    return jsonify(weather_last)


if __name__ == "__main__":
    app.run(debug=True, use_debugger=True, use_reloader=False)
