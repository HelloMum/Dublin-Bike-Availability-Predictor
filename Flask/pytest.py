import joblib
import pandas as pd

# Load the SVR model
svm_regressor = joblib.load('svm_regressor_model.pkl')

# Sample input data for prediction
input_data = pd.DataFrame({
    'number': [1],
    'day_of_week': [1],
    'hour_per_day': [16],
    'rain_hour_day': [1],
    'temperature': [13],
    'wind_speed': [2],
    'available_bike_stands': [30]
})

# Make prediction
prediction = svm_regressor.predict(input_data)

print("Predicted number of available bikes:", prediction)