import requests
import pandas as pd

# Constants
API_KEY = '8e2d39566206c680b37fa532dc58214a023b6783' 
CONTRACT_NAME = 'dublin'  

# Function to get stations data
def get_stations_data(api_key, contract_name):
    url = f"https://api.jcdecaux.com/vls/v1/stations?contract={contract_name}&apiKey={api_key}"
    response = requests.get(url)
    return response.json()

# Fetch data from JCDecaux API
stations_data = get_stations_data(API_KEY, CONTRACT_NAME)

# Create a DataFrame
df = pd.json_normalize(stations_data)

print(df.head())

# Save this DataFrame to a CSV file
df.to_csv('stations_data.csv', index=False)
