

class Link:
    def __init__(self, database):
        self.session = "Normal"
        self.database = database
        self.static_stations = []
        self.dynamic_stations = []

    def get_static_stations(self):
        return self.static_stations

    def populate_map_all(self):
        if self.get_static_all_stations():
            return render_template('index.html', stations=self.static_stations, MAPS_APIKEY=app.config.get('MAPS_APIKEY'))

        print("Error fetching the static stations")

    def get_dynamic_by_id(self, station_id):
        return

    def get_static_by_id(self, station_id):
        return

    def get_static_all_stations(self):  # This is faster
        self.static_stations = []
        try:
            cursor = self.database.cursor()
            cursor.execute("SELECT * FROM stations_static")
            rows = cursor.fetchall()
            for row in rows:
                self.static_stations.append({
                    'number': row['place_id'],
                    'name': row['place_name'],
                    'latitude': row['place_latitude'],
                    'longitude': row['place_longitude'],
                    'title': row['place_address'],
                })

        except Exception as e:
            print(f"Error fetching data from database: {str(e)}")
            cursor.close()
            return False
        finally:
            cursor.close()
        return True

    def get_dynamic_all_stations(self):  # This requires more time
        stations_all_static = []
        try:
            cursor = self.database.cursor()
            cursor.execute("SELECT * FROM stations_dynamic")
            rows = cursor.fetchall()

            for row in rows:
                self.dynamic_stations.append({
                    'number': row['place_name'],
                    'name': row['place_address'],
                    'latitude': row['place_latitude'],
                    'longitude': row['place_longitude'],
                    'title': row['title'],
                    'status': row['status'],
                    'bike_stands': row['bike_stands'],
                    'available_bikes': row['available_bikes']
                })
        except Exception as e:
            print(f"Error fetching data from database: {str(e)}")
            return False
        finally:
            cursor.close()

        return True

    def get_weather(self):
        def getweather():
            weather_data_last = {}
            try:
                cursor = self.database.cursor()
                cursor.execute("SELECT * FROM weather_data ORDER BY timestamp DESC LIMIT 1")
                row = cursor.fetchone()
                if row:
                    weather_data_last = {
                        'id': row['id'],
                        'timestamp': row['timestamp'],
                        'temperature': row['temperature'],
                        'main_event': row['main_event'],
                        'rain_hour_day': row['rain_hour_day'],
                        'feels_like': row['feels_like'],
                        'wind_speed': row['wind_speed'],
                        'description': row['description']
                    }
            except Exception as e:
                print(f"Error fetching data from database: {str(e)}")
                return "Error"

            return weather_data_last

if __name__ == "__main__":
    print ("I just a module, sorry...")