from flask import jsonify


class Link:
    def __init__(self, database):
        print("Created connection to database")
        self.database = database

    def __enter__(self):
        # Create cursor when entering
        print("Hi")
        if self.database:
            self.cursor = self.database.cursor()
            return
        return


    def __exit__(self, exc_type, exc_value, traceback):
        # Close cursor and database connection
        print("Bye")
        self.cursor.close()
        return

    def get_dynamic_all_stations_last(self):
        with self:  # Leverage the context manager for resource management
            self.cursor.execute(
                'SELECT * FROM stations_dynamic ORDER BY last_update LIMIT 114')
            rows = self.cursor.fetchall()
            dynamic_all_stations = rows  # Store raw data, not jsonify(rows)

            # Print data for debugging
            print("dyna Stations (raw):", rows)
            return dynamic_all_stations

    def get_static_all_stations_all(self):
        with self:
            self.cursor.execute(
                'SELECT * FROM stations_static ORDER BY place_name')
            rows = self.cursor.fetchall()
            static_all_stations = rows  # Store raw data, not jsonify(rows)

            # Print data for debugging
            print("Static Stations (raw):", rows)
            return static_all_stations

    def get_weather_last(self):
        with self:
            self.cursor.execute("SELECT * FROM weather_data ORDER BY timestamp DESC LIMIT 1")
            weather_data = self.cursor.fetchone()
            # Print data for debugging
            print(weather_data)

        return weather_data  # Return raw data



if __name__ == "__main__":
    print("I am just a module, sorry...")
