import time

import pandas as pd
from flask import Flask, render_template, jsonify, send_file, request
import matplotlib

matplotlib.use('Agg')  # Set the backend before importing pyplot
from matplotlib import pyplot as plt
import seaborn as sns
from DBinterface import Link
import config
import joblib
from datetime import datetime, timedelta

# Initialize Google Maps client and app instance

# MySQL configurations


print("Starting app...")

app = Flask(__name__)
app.config["MAPS_APIKEY"] = config.GOOGLE_MAPS_API_KEY
DBconfig = config.CNX

with app.app_context():
    svm_regressor = joblib.load('svm_regressor_model.pkl')
    print("App context started")
    database = Link(DBconfig)
    dynamic_last = database.get_dynamic_all_stations_last()
    static_all = database.get_static_all_stations_all()
    weather_last = database.get_weather_last()

    # Checking there are no issues
    print(dynamic_last)
    print(static_all)
    print(weather_last)


@app.route('/plot_heatmap', methods=['POST'])
def plot_heatmap_route():
    time.sleep(0.4)

    # Get the JSON data from the request
    station = request.json
    print("Received ID:", station)

    # Sample input data for prediction
    input_data, hours_of_day = generate_context_station(station)

    # Make prediction
    prediction = svm_regressor.predict(input_data)

    # Combine features and prediction for the test data
    test_data_with_prediction = input_data.copy()
    test_data_with_prediction['Predicted Available Bikes'] = prediction

    # Generate heatmap
    pivot_table = test_data_with_prediction.pivot_table(index='number', columns='hour_per_day',
                                                        values='Predicted Available Bikes', aggfunc='mean')
    print(pivot_table)

    # Get current hour
    current_hour = datetime.now().hour

    plt.figure(figsize=(12, 8))
    sns.heatmap(pivot_table, cmap='viridis', linecolor='white', linewidth=1)
    plt.axvline(x=current_hour, color='r', linestyle='--', label='Current Time')
    plt.title('Predicted Available Bikes for Station {} - Current Time: {}'.format(station['station'], current_hour))
    plt.xlabel('Hour of the Day')
    plt.ylabel('Bike Station Number')
    plt.legend()
    # Save the plot as an image
    plt.savefig('heatmap.png')
    plt.close()


    return send_file("heatmap.png", mimetype='image/png')


@app.route('/predict', methods=['POST'])
def predict():
    time.sleep(0.1)
    # Get the JSON data from the request
    station = request.json
    print("Received ID:", station)

    # Sample input data for prediction
    input_data, hours_of_day = generate_context_station(station)

    # Make prediction
    prediction = svm_regressor.predict(input_data)
    # Get current hour
    current_hour = datetime.now().hour

    # Plot the predicted available bikes over the day
    plt.figure(figsize=(10, 6))
    plt.plot(hours_of_day, prediction, marker='o', linestyle='-', label='Predicted Available Bikes')
    plt.axvline(x=current_hour, color='r', linestyle='--', label='Current Time')
    plt.title('Predicted Available Bikes for Station {} - Current Time: {}'.format(station['station'], current_hour))
    plt.xlabel('Hour of the Day')
    plt.ylabel('Predicted Available Bikes')
    plt.grid(True)
    plt.legend()
    plt.savefig('predict_img.png')
    plt.close()
    return send_file("predict_img.png", mimetype='image/png')



def generate_context_station(station):
    station = station['station']

    # Generate 24 hours since now
    hours_of_day = [(datetime.now().hour + i) % 24 for i in range(24)]
    week_day = int(datetime.now().weekday())

    print("Current hour:", hours_of_day)
    print("Current day of the week:", week_day)

    # Filter dynamic_last to find information for the specified station
    dynamic_last_asked = [station_info for station_info in dynamic_last if station_info['id'] == station]

    print("Filtered station information:", dynamic_last_asked)

    if dynamic_last_asked:
        available_bike_stands = dynamic_last_asked[0]['available_bike_stands']
    else:
        available_bike_stands = 0

    print("Available bike stands:", available_bike_stands)

    # Extracted information
    number_list = [station] * 24
    day_of_week_list = [week_day] * 24
    rain_hour_day_list = [1] * 24
    temperature_list = [13] * 24
    wind_speed_list = [2] * 24
    available_bike_stands_list = [available_bike_stands] * 24

    print("Constructed lists:")
    print("Number:", number_list)
    print("Day of week:", day_of_week_list)
    print("Rain hour day:", rain_hour_day_list)
    print("Temperature:", temperature_list)
    print("Wind speed:", wind_speed_list)

    # Construct DataFrame
    input_data = pd.DataFrame({
        'number': number_list,
        'day_of_week': day_of_week_list,
        'hour_per_day': hours_of_day,
        'rain_hour_day': rain_hour_day_list,
        'temperature': temperature_list,
        'wind_speed': wind_speed_list,
        'available_bike_stands': available_bike_stands_list
    })

    return input_data, hours_of_day

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
