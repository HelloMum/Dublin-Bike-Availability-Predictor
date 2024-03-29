import pandas as pd
import re

# Read the SQL dump file
dump_file_path = 'demo.sql'
with open(dump_file_path, 'r') as file:
    sql_dump_content = file.read()

# ext
def extract_table_data(table_name, sql_dump_content):
    data_rows = re.findall(fr'INSERT INTO `{table_name}` VALUES \((.*?)\);', sql_dump_content)
    data = [row.strip('\'').split(',') for row in data_rows]
    return data

# Define a function to export data to CSV and create a dataframe too
def export_to_csv(table_name, data):
    if not os.path.exists("ExportedData"):
        os.makedirs("ExportedData")
    data_frame = pd.DataFrame(data, columns=['id', 'number', 'name', 'banking', 'bonus', 'status',
                                             'last_update', 'api_update', 'available_bikes',
                                             'available_bike_stands', 'bike_stands'])
    data_frame = data_frame.applymap(lambda x: x.strip('`'))
    csv_file_name = f'ExportedData/{table_name}.csv'
    data_frame.to_csv(csv_file_name, index=False)
    print(f"Data from table '{table_name}' exported to '{csv_file_name}' check for more information.")

# Setting up different tables
tables_to_export = ['stations_dynamic']
for table_name in tables_to_export:
    table_data = extract_table_data(table_name, sql_dump_content)
    export_to_csv(table_name, table_data)