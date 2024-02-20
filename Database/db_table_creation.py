# This program creates the setup base in the database, expects 'Bikes' database

import mysql.connector

# We setup DB the configuration with these settings, use this connector for the fetch
cnx = mysql.connector.connect(user='root', password='kZhzE5GvxLTHaeKQF6VB',
                              host='127.0.0.1',
                              database='Bikes')


# Try to connect, more information on dev.mysql.com/doc/connector-python
def connect_to_mysql(config, attempts=3, delay=2):
    print("Connecting to the database...")
    attempt = 1
    # Implement a reconnection routine
    while attempt < attempts + 1:
        try:
            return mysql.connector.connect(**config)
        except (mysql.connector.Error, IOError) as err:
            if attempts is attempt:
                # Attempts to reconnect failed; returning None
                return None
            attempt += 1
    return None


def tables_setup(cursor):
    print("Creating DATABASE configuration...")

    # Check for dynamic setup
    dynamic_table_query = ("\n"
                           "          CREATE TABLE IF NOT EXISTS stations_dynamic (\n"
                           "              id INT AUTO_INCREMENT PRIMARY KEY,\n"
                           "              number INT,\n"
                           "              name VARCHAR(255),\n"
                           "              banking BOOLEAN,\n"
                           "              bonus BOOLEAN,\n"
                           "              status VARCHAR(255),\n"
                           "              last_update TIMESTAMP,\n"
                           "              api_update TIMESTAMP,\n"
                           "              available_bikes INT,\n"
                           "              available_bike_stands INT,\n"
                           "              bike_stands INT\n"
                           "          )\n"
                           "      ")
    try:
        cursor.execute(dynamic_table_query)
        cnx.commit()
        print("Dynamic database already exists")
    except mysql.connector.Error as err:
        print(err.msg)
    else:
        print("Data base not configured, creating new table bike_dynamic...")

    # Check for static setup
    static_table_query = ("\n"
                          "      CREATE TABLE IF NOT EXISTS stations_static (\n"
                          "          place_id INT AUTO_INCREMENT PRIMARY KEY,\n"
                          "          place_name VARCHAR(255),\n"
                          "          place_address VARCHAR(255),\n"
                          "          place_latitude DECIMAL(10, 6),\n"
                          "          place_longitude DECIMAL(10, 6),\n"
                          "          api_update TIMESTAMP\n"
                          "      )\n"
                          "      ")
    try:
        cursor.execute(static_table_query)
        cnx.commit()
        print("Data base not configured, creating new table bike_dynamic...")
    except mysql.connector.Error as err:
        print(err.msg)
    else:
        print("Error on static table...")

    print("Checking that tables exist...")

    # Check for static setup

    static_table_query = ("CREATE TABLE IF NOT EXISTS weather_data (\n"
                          "    id INT AUTO_INCREMENT PRIMARY KEY,\n"
                          "    timestamp DATETIME,\n"
                          "    temperature FLOAT,\n"
                          "    main_event VARCHAR(255),\n"
                          "    rain_hour_day FLOAT,\n"
                          "    feels_like FLOAT,\n"
                          "    humidity INT,\n"
                          "    wind_speed FLOAT,\n"
                          "    description VARCHAR(255)\n"
                          ");")
    try:
        cursor.execute(static_table_query)
        cnx.commit()
        print("Weather database created successfully")
    except mysql.connector.Error as err:
        print(err.msg)
    else:
        print("Error on weather table. Already exist?")

    print("Checking that tables exist...")


cursor = cnx.cursor()
tables_setup(cursor)
cnx.close()
print("Finished setting up")
