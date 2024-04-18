let map, directionsService, directionsRenderer, locationMarker = null, lastKnownLocation = null;


// Prevent zooming in and out on the brpwser window
window.addEventListener('wheel', function (event) {
    if (event.ctrlKey === true || event.metaKey) {
        event.preventDefault();
    }
}, { passive: false });

window.addEventListener('keydown', function (event) {
    if ((event.ctrlKey === true || event.metaKey) && (event.key === '0' || event.key === '+' || event.key === '-' || event.key === '=')) {
        event.preventDefault();
    }
}, { passive: false });

// =======================================================================================
// #####################  FUNCTIONS FOR THE SEARCH BAR  ##################################


// =======================================================================================
// ---------------------AUTOCOMPLETE FUNCTION --------------------------------------------
const setupAutocomplete = (map, staticData, dynamicData, AdvancedMarkerElement, PinElement) => {
    const searchAutocomplete = new google.maps.places.Autocomplete(document.getElementById('searchBarInput'));
    searchAutocomplete.bindTo('bounds', map);

    searchAutocomplete.addListener('place_changed', async () => {
        const place = searchAutocomplete.getPlace();
        if (!place.geometry) return console.log("Returned place contains no geometry");

        lastKnownLocation = place.geometry.location;
        placeLocationMarker(lastKnownLocation, AdvancedMarkerElement, PinElement, map);

        await findNearestBikeStations(lastKnownLocation.lat(), lastKnownLocation.lng(), dynamicData, staticData, map, AdvancedMarkerElement);
        directionsRenderer.setDirections({ routes: [] });
    });
};
// ---------------------AUTOCOMPLETE FUNCTION END-----------------------------------------
// =======================================================================================


// =======================================================================================
// ---------------------DISTANCE FUNCTIONS -----------------------------------------------

// Function to calculate the distance between two points using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Error checking lat nad lng
const isValidLatLng = (lat, lng) => typeof lat === 'number' && typeof lng === 'number' && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

// Function to find the nearest bike stations to a location
const findNearestBikeStations = async (userLatitude, userLongitude, dynamicData, staticData, map, AdvancedMarkerElement) => {
    const crowFliesDistances = staticData.map(station => ({
        ...station,
        crowFliesDistance: calculateDistance(userLatitude, userLongitude, station.place_latitude, station.place_longitude)
    }));

    crowFliesDistances.sort((a, b) => a.crowFliesDistance - b.crowFliesDistance);

    const closestByCrowFlies = crowFliesDistances.slice(0, 10);
    const destinations = closestByCrowFlies.map(station => {
        const latitude = parseFloat(station.place_latitude);
        const longitude = parseFloat(station.place_longitude);

        if (!isValidLatLng(latitude, longitude)) {
            console.error('Invalid latitude and longitude for station:', station);
            return null;
        }

        return new google.maps.LatLng(latitude, longitude);
    }).filter(Boolean);

    const service = new google.maps.DistanceMatrixService();

    service.getDistanceMatrix({
        origins: [new google.maps.LatLng(userLatitude, userLongitude)],
        destinations: destinations,
        travelMode: 'WALKING',
    }, (result, status) => {
        if (status === google.maps.DistanceMatrixStatus.OK) {
            const distances = result.rows[0].elements;
            const distanceData = closestByCrowFlies.map((station, index) => {
                const dynamicStation = dynamicData.find(dynamic => dynamic.id === station.place_id);
                return {
                    ...station,
                    status: dynamicStation ? dynamicStation.status : 'N/A',
                    distance: distances[index].distance.text,
                    distanceValue: distances[index].distance.value,
                    available_bikes: dynamicStation ? dynamicStation.available_bikes : 'N/A',
                    available_bike_stands: dynamicStation ? dynamicStation.available_bike_stands : 'N/A'
                };
            });

            distanceData.sort((a, b) => a.distanceValue - b.distanceValue);

            const closestStations = distanceData.slice(0, 5);
            const userLocation = new google.maps.LatLng(userLatitude, userLongitude);
            populateDropdownWithStations(closestStations, userLocation, map, AdvancedMarkerElement);
        }
    });
};
// ---------------------DISTANCE FUNCTIONS END-------------------------------------------
// =======================================================================================


// =======================================================================================
// ---------------------SEARCHBAR LIST DROPDOWN ------------------------------------------
// Function to populate the dropdown with the closest stations
const populateDropdownWithStations = (closestStations, userLocation, map, AdvancedMarkerElement) => {
    const dropdown = document.getElementById('dropdown-content');
    dropdown.innerHTML = '';
    const fragment = document.createDocumentFragment();

    closestStations.forEach(station => {
        const option = document.createElement('button');
        option.innerHTML =
            `<div class="station-info">
        <span class="station-name"><b>${station.place_address}</b></span>

        <img src="static/img/openclosedIcon.png" alt="Status" class="status-icon" />
        <span class="station-status">${station.status}</span>

        <img src="static/img/distanceIcon.png" alt="Distance" class="distance-icon" />
        <span class="station-distance">${station.distance}</span>

        <img src="static/img/bike.png" alt="Bikes" class="bikes-icon" />
        <span class="station-bikes">${station.available_bikes}</span>

        <img src="static/img/parkingIcon.png" alt="Stands" class="stands-icon" />
        <span class="station-bike-stands">${station.available_bike_stands}</span>
        </div>
        `;
        option.addEventListener('click', () => calculateAndDisplayRoute(directionsService, directionsRenderer, userLocation, station, map, AdvancedMarkerElement));

        
        fragment.appendChild(option);
    });

    dropdown.appendChild(fragment);
};
// ---------------------SEARCHBAR LIST DROPDOWN END--------------------------------------
// =======================================================================================


// =======================================================================================
// ---------------------ROUTE FUNCTIONS --------------------------------------------------
// Define the function to calculate and display the route
const calculateAndDisplayRoute = async (directionsService, directionsRenderer, userLocation, station, map) => {
    try {
        const response = await new Promise((resolve, reject) => {
            directionsService.route({
                origin: userLocation,
                destination: new google.maps.LatLng(station.place_latitude, station.place_longitude),
                travelMode: 'WALKING'
            }, (result, status) => {
                if (status === 'OK') {
                    resolve(result);
                } else {
                    reject('Directions request failed due to ' + status);
                }
            });
        });
        directionsRenderer.setDirections(response);
        directionsRenderer.setOptions({ preserveViewport: true });
    } catch (error) {
        console.error(error);
        window.alert(error);
    }
};
// ---------------------ROUTE FUNCTIONS END----------------------------------------------
// =======================================================================================
// #####################  FUNCTIONS FOR THE SEARCH BAR  #######################################
// ============================================================================================


// =======================================================================================
// ---------------------MAP INITIALISATION -----------------------------------------------
window.initMap = async () => {
    try {
        const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");
        const dublin = { lat: 53.346578, lng: -6.3 };

        map = new google.maps.Map(document.getElementById('map'), {
            zoom: 14,
            center: dublin,
            mapId: 'BIKES_MAP',
        });

        directionsService = new google.maps.DirectionsService();
        directionsRenderer = new google.maps.DirectionsRenderer({
            map: map,
            provideRouteAlternatives: true,
            suppressMarkers: true,
            polylineOptions: {
                strokeColor: 'blue',
                strokeOpacity: 0.7,
                strokeWeight: 5
            }
        });

        const staticResponse = await fetch('/stations_static');
        const staticData = await staticResponse.json();
        const dynamicResponse = await fetch('/stations_dynamic');
        const dynamicData = await dynamicResponse.json();

        setupAutocomplete(map, staticData, dynamicData, AdvancedMarkerElement, PinElement);
        addMarkers(staticData, dynamicData, PinElement, AdvancedMarkerElement, map);

        map.addListener('click', (e) => {
            placeLocationMarker(e.latLng, AdvancedMarkerElement, PinElement, map);
            updateSearchBarAndFindBikeStations(e.latLng, staticData, dynamicData, map);
        });
    } catch (error) {
        console.error('Error initializing map:', error);
    }
};
// ---------------------MAP INITIALISATION END-------------------------------------------
//=======================================================================================


// =======================================================================================
// ---------------------MAP MARKER FUNCTIONS ---------------------------------------------
const placeLocationMarker = (lastKnownLocation, AdvancedMarkerElement, PinElement, map) => {
    if (!locationMarker) {
        const userPinIcon = document.createElement('img');
        userPinIcon.src = 'static/img/userPin.png';
        userPinIcon.id = 'userPin';
        userPinIcon.alt = 'User Pin';
        userPinIcon.style.borderRadius = '40%';
        userPinIcon.style.width = '40px';
        userPinIcon.style.height = '40px';

        const userPin = new PinElement({
            borderColor: 'transparent',
            background: 'lightyellow',
            glyph: userPinIcon,
            scale: 1.5,
        });

        locationMarker = new AdvancedMarkerElement({
            map: map,
            position: lastKnownLocation,
            content: userPin.element,
            gmpClickable: true,
            gmpDraggable: false,
            title: "User Location Marker"
        });
    } else {
        directionsRenderer.setDirections({ routes: [] });
        locationMarker.position = lastKnownLocation
    }
    map.setCenter(lastKnownLocation);
    // slowly pan to it 
    map.panTo(lastKnownLocation);
};

const updateSearchBarAndFindBikeStations = async (latLng, staticData, dynamicData, map) => {
    const geocoder = new google.maps.Geocoder();
    try {
        const geocodeResult = await geocoder.geocode({ location: latLng });
        const address = geocodeResult.results[0].formatted_address;
        document.getElementById('searchBarInput').value = address;

        findNearestBikeStations(latLng.lat(), latLng.lng(), dynamicData, staticData, map);
    } catch (error) {
        console.error('Geocoder failed due to: ' + error);
    }
};

const intersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add("drop");
            intersectionObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

const addMarkers = (staticData, dynamicData, PinElement, AdvancedMarkerElement, map) => {
    const infoWindow = new google.maps.InfoWindow();
    const heatmapData = [];
    staticData.forEach(staticStation => {
        const dynamicStation = dynamicData.find(dynamic => dynamic.id === staticStation.place_id);
        if (dynamicStation && dynamicStation.available_bikes !== undefined) {
            // Pin color based on the number of available bikes
            let pinImage = 'static/img/bike.png';
            const bikeIcon = document.createElement('img');
            bikeIcon.src = pinImage;
            bikeIcon.alt = 'Bike';

            const pin = new PinElement({
                borderColor: 'transparent',
                background: 'transparent',
                glyph: bikeIcon,
                glyphColor: '#transparent',
                scale: 1,
            });
            bikeIcon.style.width = "50px";
            bikeIcon.style.height = "50px";

            const markerElement = new AdvancedMarkerElement({
                map: map,
                position: new google.maps.LatLng(parseFloat(staticStation.place_latitude), parseFloat(staticStation.place_longitude)),
                content: pin.element,
                gmpClickable: true,
                title: staticStation.place_name
            });

            // Add the available bikes as a weight for the heatmap
            const weightedLocation = {
                location: new google.maps.LatLng(parseFloat(staticStation.place_latitude), parseFloat(staticStation.place_longitude)),
                weight: dynamicStation.available_bikes
            };
            heatmapData.push(weightedLocation);

            if (markerElement.content) {
                const content = markerElement.content;

                content.style.opacity = "0";
                content.classList.add("drop");

                content.addEventListener("animationend", () => {
                    content.classList.remove("drop");
                    content.style.opacity = "1";
                });

                const time = 1.5 + Math.random();
                content.style.setProperty("--delay-time", `${time}s`);

                // Observe the marker for when it enters the viewport
                intersectionObserver.observe(content);
            }

            markerElement.addListener('gmp-click', () => {
                const statusColor = dynamicStation.status === 'OPEN' ? 'green' : 'red';
                const contentString = `
                <div id="content">
                    <h3>${staticStation.place_address}</h3>
                    <p><b>Status:</b> <span style="color: ${statusColor};"><strong>${dynamicStation.status}</strong></span></p>
                    <p><b>Available Bikes:</b> ${dynamicStation.available_bikes}</p>
                    <p><b>Available Bike Stands:</b> ${dynamicStation.available_bike_stands}</p>
                    <p><b>Total Bike Stands:</b> ${dynamicStation.bike_stands}</p>
                </div>`;

                infoWindow.setContent(contentString);
                infoWindow.setPosition(new google.maps.LatLng(staticStation.place_latitude, staticStation.place_longitude));
                infoWindow.open(map);
                getHeatmap(staticStation.place_id);
                displayActualVsPredictedPlot(staticStation.place_id);
            });
        }
    });
    // Create and display the heatmap
    const heatmap = new google.maps.visualization.HeatmapLayer({
        data: heatmapData,
        map: map,
        radius: 30
    });
};

// ---------------------MAP MARKER FUNCTIONS END-----------------------------------------
//=======================================================================================



//###########################################################################################
// ---------------------ONLOAD FUNCTIONS ----------------------------------------------------
// Make sure the map and sidebars are loaded before running
window.addEventListener('load', () => {
    initMap();

    document.getElementById('toggle-right-sidebar').addEventListener('click', () => {
        const rightSidebar = document.getElementById('rightSidebar');
        const toggleButton = document.getElementById('toggle-right-sidebar');

        const isSidebarVisible = rightSidebar.style.transform === 'translateX(0%)';

        if (isSidebarVisible) {
            rightSidebar.style.transition = 'transform 0.3s ease-out';
            rightSidebar.style.transform = 'translateX(100%)';
            toggleButton.classList.remove('small-button');
            toggleButton.style.removeProperty('right');
        } else {
            rightSidebar.style.transition = 'transform 0.3s ease-in';
            rightSidebar.style.transform = 'translateX(0%)';
            toggleButton.classList.add('small-button');
            toggleButton.style.right = 'calc(26%)';
        }
    });


    //=======================================================================================
    // ---------------------WEATHER FUNCTION ------------------------------------------------
    // Fetch and display weather data
    fetch('/weather')
        .then(response => response.json())
        .then(data => {
            const weatherInfo = document.createElement('p');
            const weatherDetails = data[0];
            weatherInfo.innerHTML =
                `Weather:</b> ${weatherDetails.description.charAt(0).toUpperCase() + weatherDetails.description.slice(1)}<br>
                Temperature:</b> ${weatherDetails.temperature}°C<br>`;
            document.getElementById('weather-data').appendChild(weatherInfo);
        })
        .catch(error => console.error('Error:', error));

    // Update time every second
    const updateTime = () => {
        document.getElementById('current-time').textContent = new Date().toLocaleTimeString();
    };
    setInterval(updateTime, 1000);
});


function getWeatherAndPredict(station) {
    fetch('/weather')
        .then(response => response.json())
        .then(currentWeather => {
            const weatherData = currentWeather[0];
            getPredictionForStation(station, weatherData);
        })
        .catch(error => console.error('Error fetching weather data:', error));
}



document.addEventListener('DOMContentLoaded', function() {
    fetchWeatherAndPlot(53.349805, -6.26031); 

    function fetchWeatherAndPlot(lat, lon) {
        fetch(`/fetch_weather/${lat}/${lon}`)
        .then(response => response.json())
        .then(data => {
            const temperatures = data.list.map(entry => entry.main.temp);

            // Set to keep track of the days that have been added to the labels array
            const uniqueDays = new Set();
            // Day names, but only add a day to the labels array if it's not already there
            const labels = data.list.map(entry => {
                const date = new Date(entry.dt * 1000); 
                const day = date.toLocaleDateString('en-US', { weekday: 'long' });
                if (!uniqueDays.has(day)) {
                    uniqueDays.add(day);
                    return day; 
                }
                return ''; 
            }).filter(label => label); 
    
            plotWeatherData(labels, temperatures);
        });
    }
    
    

    function plotWeatherData(labels, data) {
        const ctx = document.getElementById('weatherChart').getContext('2d');
        const tempChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Temperature (°C)',
                    data: data,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: false
                    },
                    x: {
                        ticks: {
                            autoSkip: true, 
                            maxTicksLimit: 20,
                            maxRotation: 0, 
                            minRotation: 0,
                            fontSize: 14
                        }
                    }
                }
            }
        });
    }
});    

// ---------------------WEATHER FUNCTION END ------------------------------------------------
//===========================================================================================


// =========================================================================================
// ---------------------PREDICTION FUNCTION ------------------------------------------------
function displayActualVsPredictedPlot(stationId) {
    const requestData = {
        station: stationId,
    };
    fetch("/predict", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
    })
        .then((response) => {
            if (response.ok) {
                return response.blob();
            } else {
                throw new Error("Failed to load the predicted plot image.");
            }
        })
        .then((blob) => {
            const imageUrl = URL.createObjectURL(blob);
            const image = new Image();
            image.src = imageUrl;
            image.alt = "Predicted Data Plot";
            image.style.width = "100%";
            image.style.height = "auto";

            const bikeDataDiv = document.getElementById("BikeModel");
            bikeDataDiv.innerHTML = "";
            bikeDataDiv.appendChild(image);
        })
        .catch((error) => {
            console.error("Error fetching the Predicted Data Plot:", error);
            document.getElementById("BikeModel").innerHTML =
                "<p>Error loading plot.</p>";
        });
}

function getPredictionForStation(station, weatherData) {
    if (!weatherData) {
        console.error('weatherData is not available');
        return;
    }
    const rain_hour_day = weatherData.rain_hour_day !== null ? weatherData.rain_hour_day : 0;
    const dataForPrediction = {
        number: station.place_id,
        day_of_week: 1,
        hour_per_day: 14,
        rain_hour_day: rain_hour_day || 1,
        temperature: weatherData.temperature || 11,
        wind_speed: weatherData.wind_speed || 1,
        available_bike_stands: station.available_bike_stands || 1,
    };
    fetch('/predict_static', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataForPrediction),
    })
        .then(response => response.json())
        .then(data => {
            console.log('Prediction for Station:', data.prediction);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}


function getHeatmap(stationId) {
    const requestData = { station: stationId };
    fetch('/plot_heatmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
    })
    .then(response => response.blob())
    .then(blob => {
        const imageUrl = URL.createObjectURL(blob);
        const bikeDataDiv = document.getElementById('bike-data');
        // Clear any existing content
        bikeDataDiv.innerHTML = '';
        // Create a new img element
        const heatmapImage = new Image();
        heatmapImage.onload = function() {
            bikeDataDiv.appendChild(heatmapImage);
        };
        heatmapImage.src = imageUrl;
        heatmapImage.alt = 'Heatmap Image';
        heatmapImage.style.width = 'auto'; 
        heatmapImage.style.height = '110%';
        heatmapImage.style.marginRight = '-12%';
    })  
    .catch(error => {
        console.error('Error fetching the heatmap image:', error);
    });
}

// ---------------------PREDICTION FUNCTION END --------------------------------------------
//===========================================================================================
