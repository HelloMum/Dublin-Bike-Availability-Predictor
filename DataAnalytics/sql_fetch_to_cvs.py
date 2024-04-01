import os
import mysql.connector
import csv

# Database connection configuration, DON'T USE THE PRODUCTION SERVER!
db_config = {
    "user": "root",
    "password": "kZhzE5GvxLTHaeKQF6VB",
    "host": "127.0.0.1",
    "database": "Bikes"
}

# Create ExportedData subfolder if it doesn't exist
export_folder = "ExportedData"
if not os.path.exists(export_folder):
    os.makedirs(export_folder)

# Connect to MySQL database
try:
    cnx = mysql.connector.connect(**db_config)
    cursor = cnx.cursor()
    print("Connected to the database.")
except mysql.connector.Error as err:
    print("Error connecting to the database:", err)
    exit(1)

# Function to fetch data from tables and write to CSV file
def export_to_csv(cursor, table_name, csv_file):
    try:
        cursor.execute(f"SELECT * FROM {table_name}")
        headers = [col[0] for col in cursor.description]
        rows = cursor.fetchall()
        with open(os.path.join(export_folder, csv_file), 'w', newline='') as file:
            writer = csv.writer(file)
            writer.writerow(headers)
            writer.writerows(rows)
        print(f"Data exported from {table_name} to {os.path.join(export_folder, csv_file)} successfully.")
    except mysql.connector.Error as err:
        print(f"Error exporting data from {table_name}:", err)

# Export data from tables to CSV files
export_to_csv(cursor, "stations_dynamic", "stations_dynamic.csv")
export_to_csv(cursor, "stations_static", "stations_static.csv")
export_to_csv(cursor, "weather_data", "weather_data.csv")

# Close cursor and database connection
cursor.close()
cnx.close()
