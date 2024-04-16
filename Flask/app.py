from flask import Flask, render_template, jsonify, request
from DBinterface import Link
import config
import joblib
import pandas as pd
from flask import send_file
import matplotlib.pyplot as plt
import seaborn as sns   


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
    
    
def load_test_data():
    # Load X_test and y_test from CSV files
    X_test = pd.read_csv('X_test.csv')
    y_test = pd.read_csv('y_test.csv', squeeze = True)  
    return X_test, y_test


@app.route('/plot_actual_vs_predicted')
def plot_actual_vs_predicted():
    X_test, y_test = load_test_data()
    svm_regressor = joblib.load('svm_regressor_model.pkl')
    # Make predictions on the test set
    y_pred = svm_regressor.predict(X_test)


    # Plot predicted vs actual
    plt.figure(figsize=(8, 6))
    plt.scatter(y_test, y_pred, alpha=0.5)
    plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], '--', color = 'red')
    plt.xlabel('Actual')
    plt.ylabel('Predicted')
    plt.title('Actual vs Predicted')
    plt.savefig('actual_vs_predicted.png') 
    plt.close()
    return send_file('actual_vs_predicted.png', mimetype = 'image/png', as_attachment = False)
    
    

@app.route('/plot_heatmap', methods = ['POST'])
def plot_heatmap_route():
    data = request.json
    station = data['station']
    plot_heatmap(station)
    return send_file('heatmap.png', mimetype = 'image/png')


def plot_heatmap(station):
    pivot_table = station.pivot_table(index = 'number', columns = 'hour_per_day', values = 'Predicted Available Bikes', aggfunc = 'mean')
    plt.figure(figsize = (12, 8))
    sns.heatmap(pivot_table, cmap = 'viridis', linecolor = 'white', linewidth = 1)
    plt.title('Predicted Available Bikes for ' + station)
    plt.xlabel('Hour of the Day')
    plt.ylabel('Bike Station Number')
    plt.savefig('heatmap.png') 
    plt.close() 



@app.route("/predict_static")
def predict_static():
    input_data = pd.DataFrame({
        'number': [2],
        'day_of_week': [2],
        'hour_per_day': [12],
        'rain_hour_day': [100],
        'temperature': [20],
        'wind_speed': [10],
        'available_bike_stands': [20]
    })
    prediction = model.predict(input_data)
    return jsonify({'prediction': int(prediction[0])}) 


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
