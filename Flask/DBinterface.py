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
            formatted_dynamic = [dict(zip(self.cursor.column_names, row)) for row in rows]
            return formatted_dynamic

    def get_static_all_stations_all(self):
        with self:
            self.cursor.execute(
                'SELECT * FROM stations_static ORDER BY place_name')
            rows = self.cursor.fetchall()
            # Print data for debugging
            print("Static Stations (raw):", rows)

            formatted_static_all_stations = [dict(zip(self.cursor.column_names, row)) for row in rows]

            return formatted_static_all_stations

    def get_weather_last(self):
        with self:
            self.cursor.execute("SELECT * FROM weather_data ORDER BY timestamp DESC LIMIT 1")
            rows = self.cursor.fetchall()
            # Print data for debugging
            print(rows)

        formatted_weather = [dict(zip(self.cursor.column_names, row)) for row in rows]
        return formatted_weather  # Return raw data



if __name__ == "__main__":
    print("I am just a module, sorry...")
