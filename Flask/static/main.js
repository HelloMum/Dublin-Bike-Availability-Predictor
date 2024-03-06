let map, directionsService, directionsRenderer, locationMarker = null, lastKnownLocation = null;

// =======================================================================================
// #####################  FUNCTIONS FOR THE SEARCH BAR  ##################################


// =======================================================================================
// ---------------------AUTOCOMPLETE FUNCTION --------------------------------------------
const setupAutocomplete = (map, staticData, dynamicData, AdvancedMarkerElement, PinElement) => {
    const searchAutocomplete = new google.maps.places.Autocomplete(document.getElementById('searchBarInput'));
    searchAutocomplete.bindTo('bounds', map);

    // Listen for the user's selection
    searchAutocomplete.addListener('place_changed', async () => {
        const place = searchAutocomplete.getPlace();
        if (!place.geometry) return console.log("Returned place contains no geometry");
        
        lastKnownLocation = place.geometry.location;
        // Place the users marker on map and zoom in 
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
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    // Calculate the differences in latitude and longitude between the two points in radian & covert 
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

    // Sort the stations by distance
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

    // Get the distance matrix
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
                    distance: distances[index].distance.text,
                    distanceValue: distances[index].distance.value,
                    available_bikes: dynamicStation ? dynamicStation.available_bikes : 'N/A',
                    available_bike_stands: dynamicStation ? dynamicStation.available_bike_stands : 'N/A'
                };
            });
            // Sort the stations by Matrix distance
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
    // For each station in the closest stations
    closestStations.forEach(station => {
        const option = document.createElement('button');
        option.innerHTML = `<div class="station-info">
            <span class="station-name"><b>${station.place_address}</b></span>
            <span class="station-distance"><b>Distance:</b> ${station.distance}</span>
            <span class="station-bikes"><b>Bikes:</b> ${station.available_bikes}</span>
            <span class="station-bike-stands"><b>Stands:</b> ${station.available_bike_stands}</span>
        </div>`;
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
            zoom: 13,
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

        // TODO
        document.getElementById('centerOnLocation').addEventListener('click', () => {
            if (lastKnownLocation) {
                map.setCenter(lastKnownLocation);
                map.setZoom(20);
            } else {
                console.log('No known last location.');
            }
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
        userPinIcon.src = 'static/img/userIcon.png';
        userPinIcon.id = 'userPinIcon';
        const userPin = new PinElement({
            background: 'blue',
            borderColor: 'blue',
            glyph: userPinIcon,
            glyphColor: '#ffffff',
            scale: 1
        });
        

        // Create a new marker and assign it to locationMarker
        locationMarker = new AdvancedMarkerElement({
            map: map,
            position: lastKnownLocation,
            content: userPin.element,
            gmpClickable: true,
            gmpDraggable: true,
            title: "User Location Marker"
        });
    } else {
        // Clear the directions and set the marker's position
        directionsRenderer.setDirections({ routes: [] });
        locationMarker.position = lastKnownLocation
    }
    map.setCenter(lastKnownLocation);
    map.setZoom(15);
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
    staticData.forEach(staticStation => {
        const dynamicStation = dynamicData.find(dynamic => dynamic.id === staticStation.place_id);
        if (dynamicStation) {
            const pin = new PinElement({
                background: '#ff0000',
                borderColor: '#000000',
                glyph: '',
                glyphColor: '#ffffff',
                scale: 1
            });

            const markerElement = new AdvancedMarkerElement({
                map: map,
                position: new google.maps.LatLng(parseFloat(staticStation.place_latitude), parseFloat(staticStation.place_longitude)),
                content: pin.element,
                gmpClickable: true,
                title: staticStation.place_name
            });

            if (markerElement.content) {
                const content = markerElement.content;

                content.style.opacity = "0"; 
                content.classList.add("drop"); 

                content.addEventListener("animationend", () => {
                    content.classList.remove("drop");
                    content.style.opacity = "1";
                });

                // vary the animation start time across markers
                const time = 1.5 + Math.random();
                content.style.setProperty("--delay-time", `${time}s`);

                // Observe the marker for when it enters the viewport
                intersectionObserver.observe(content);
            }

            markerElement.addListener('gmp-click', () => {
                const contentString = `
                    <div id="content">
                        <h3>${staticStation.place_address}</h3>
                        <p><b>Status:</b> ${dynamicStation.status}</p>
                        <p><b>Last Updated:</b> ${dynamicStation.api_update}</p>
                        <p><b>Available Bikes:</b> ${dynamicStation.available_bikes}</p>
                        <p><b>Available Bike Stands:</b> ${dynamicStation.available_bike_stands}</p>
                        <p><b>Total Bike Stands:</b> ${dynamicStation.bike_stands}</p>
                    </div>`;

                infoWindow.setContent(contentString);
                infoWindow.setPosition(new google.maps.LatLng(staticStation.place_latitude, staticStation.place_longitude));
                infoWindow.open(map);
            });
        }
    });
};
// ---------------------MAP MARKER FUNCTIONS END-----------------------------------------
//=======================================================================================


//###########################################################################################
// ---------------------ONLOAD FUNCTIONS ----------------------------------------------------
// Make sure the map and sidebars are loaded before running
window.addEventListener('load', () => {
    initMap();

    // Initialize right sidebar's initial state
    document.getElementById('rightSidebar').style.transform = 'translateX(100%)';
    document.getElementById('rightSidebar').style.transition = 'transform 0.5s ease-in-out';

    // Toggle right sidebar on button click
    document.getElementById('toggle-right-sidebar').addEventListener('click', () => {
        const rightSidebar = document.getElementById('rightSidebar');
        rightSidebar.style.transform = rightSidebar.style.transform === 'translateX(100%)' ? 'translateX(0)' : 'translateX(100%)';
    });

    // Fetch and display dynamic station data
    fetch('/stations_dynamic')
        .then(response => response.json())
        .then(data => {
            const bikeInfo = document.createElement('p');
            bikeInfo.textContent = `Bike Info: ${JSON.stringify(data)}`;
            document.getElementById('bike-data').appendChild(bikeInfo);
        })
        .catch(error => console.error('Error:', error));

    //=======================================================================================
    // ---------------------WEATHER FUNCTION ------------------------------------------------
    // Fetch and display weather data
    fetch('/weather')
        .then(response => response.json())
        .then(data => {
            const weatherInfo = document.createElement('p');
            const weatherDetails = data[0];
            weatherInfo.textContent =
                `Weather: ${weatherDetails.description},\n
            Tempature: ${weatherDetails.temperature}°C\n
            Wind Speed: ${weatherDetails.wind_speed} km/h`;
            document.getElementById('weather-data').appendChild(weatherInfo);
        })
        .catch(error => console.error('Error:', error));

    // ---------------------WEATHER FUNCTION END ------------------------------------------------
    //===========================================================================================

    // Update time every second
    const updateTime = () => {
        document.getElementById('current-time').textContent = new Date().toLocaleTimeString();
    };
    setInterval(updateTime, 1000);
});

