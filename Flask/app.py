
import pandas as pd
from flask import Flask, render_template, jsonify, send_file, request
import matplotlib
matplotlib.use('Agg')  # Set the backend before importing pyplot
from matplotlib import pyplot as plt
import seaborn as sns
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



@app.route('/plot_heatmap', methods=['POST'])
def plot_heatmap_route():
    # Get the JSON data from the request
    station = request.json
    print("Received ID:", station)
    hours_of_day = list(range(1, 25))
    # Sample input data for prediction
    input_data = pd.DataFrame({
        'number': [station['station']] * len(hours_of_day),
        'day_of_week': [1] * len(hours_of_day),
        'hour_per_day': hours_of_day,
        'rain_hour_day': [1] * len(hours_of_day), 
        'temperature': [13] * len(hours_of_day),  
        'wind_speed': [2] * len(hours_of_day), 
        'available_bike_stands': [30] * len(hours_of_day)
    })

    # Make prediction
    prediction = svm_regressor.predict(input_data)

    # Combine features and prediction for the test data
    test_data_with_prediction = input_data.copy()
    test_data_with_prediction['Predicted Available Bikes'] = prediction

    # Generate heatmap
    pivot_table = test_data_with_prediction.pivot_table(index='number', columns='hour_per_day', values='Predicted Available Bikes', aggfunc='mean')
    print(pivot_table)

    plt.figure(figsize=(12, 8))
    sns.heatmap(pivot_table, cmap='viridis', linecolor='white', linewidth=1)
    plt.title('Predicted Available Bikes for Station {}'.format(station['station']))
    plt.xlabel('Hour of the Day')
    plt.ylabel('Bike Station Number')

    # Save the plot as an image
    plt.savefig('heatmap.png')
    plt.close()

    # Return the image file as a response
    return send_file('heatmap.png', mimetype='image/png')

@app.route('/predict', methods=['POST'])
def predict():
    # Get the JSON data from the request
    station = request.json
    print("Received ID:", station)

    # Sample input data for prediction
    input_data = pd.DataFrame({
        'number': [station['station']],
        'day_of_week': [1],
        'hour_per_day': [16],
        'rain_hour_day': [1],
        'temperature': [13],
        'wind_speed': [2],
        'available_bike_stands': [30]
    })

    # Make prediction
    prediction = svm_regressor.predict(input_data)

    fig, ax = plt.subplots()
    ax.plot(prediction)
    ax.set_title("Predicted Data Plot")
    plt.savefig('predict_img.png')
    plt.close(fig)

    # Return the plot as a response
    return send_file("predict_img.png", mimetype='image/png')



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
