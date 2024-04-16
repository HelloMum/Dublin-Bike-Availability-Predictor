from flask import Flask, render_template, jsonify, request
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
    model = joblib.load('SVM_model.pkl')
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
    try:
        # Get input data from request
        data = request.get_json()
        features = [
            data['number'],
            data['day_of_week'],
            data['hour_per_day'],
            data['rain_hour_day'],
            data['temperature'],
            data['wind_speed'],
            data['available_bike_stands']
        ]

        # Make prediction using the loaded model
        prediction = model.predict([features])[0]

    # Return prediction as JSON response
        return jsonify({'prediction': prediction})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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
