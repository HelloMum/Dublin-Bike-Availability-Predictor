let map;
let directionsService;
let directionsRenderer;


// =======================================================================================
// #####################  FUNCTIONS FOR THE SEARCH BAR  ##################################


// =======================================================================================
// ---------------------AUTOCOMPLETE FUNCTION --------------------------------------------
function setupAutocomplete(map, staticData, dynamicData) {
    let searchBarInput = document.getElementById('searchBarInput');
    let searchAutocomplete = new google.maps.places.Autocomplete(searchBarInput);
    searchAutocomplete.bindTo('bounds', map);
    
    // Listen for the user's selection
    searchAutocomplete.addListener('place_changed', function() {
    let place = searchAutocomplete.getPlace();
    if (!place.geometry) {
        console.log("Returned place contains no geometry");
        return;
    }

    // Move the map to the selected place
    map.panTo(place.geometry.location);
    map.setZoom(15);

    // Nearby Search for bike stations around the selected location
    findNearestBikeStations(place.geometry.location.lat(), place.geometry.location.lng(), dynamicData, staticData, map);
});
}
// ---------------------AUTOCOMPLETE FUNCTION END-----------------------------------------
// =======================================================================================


// =======================================================================================
// ---------------------DISTANCE FUNCTIONS -----------------------------------------------
//TODO: DECIDE IF WE WANT THIS FORMULA OR ANOTHER
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
function isValidLatLng(lat, lng) {
    return typeof lat === 'number' && typeof lng === 'number' && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

// Function to find the nearest bike stations to a location
function findNearestBikeStations(userLatitude, userLongitude, dynamicData, staticData, map) {
    // Calculate straight line distances
    let crowFliesDistances = staticData.map(station => ({
        ...station,
        crowFliesDistance: calculateDistance(userLatitude, userLongitude, station.place_latitude, station.place_longitude)
    }));

    // Sort 
    crowFliesDistances.sort((a, b) => a.crowFliesDistance - b.crowFliesDistance);

    // Top 10 closest stations for Distance Matrix API
    let closestByCrowFlies = crowFliesDistances.slice(0, 10);
    let destinations = closestByCrowFlies.map(station => {
        let latitude = parseFloat(station.place_latitude);
        let longitude = parseFloat(station.place_longitude);

        if (!isValidLatLng(latitude, longitude)) {
            console.error('Invalid latitude and longitude for station:', station);
            return null;
        }

        return new google.maps.LatLng(latitude, longitude);
    }).filter(Boolean);

    let service = new google.maps.DistanceMatrixService();

    // Distance Matrix API to calculate walking distances
    service.getDistanceMatrix({
        origins: [new google.maps.LatLng(userLatitude, userLongitude)],
        destinations: destinations,
        travelMode: 'WALKING',
    }, (result, status) => {
        if (status === google.maps.DistanceMatrixStatus.OK) {
            let distances = result.rows[0].elements;
            let distanceData = closestByCrowFlies.map((station, index) => {
                // Find dynamic data for each station
                let dynamicStation = dynamicData.find(dynamic => dynamic.id === station.place_id);
                return {
                    ...station,
                    distance: distances[index].distance.text,
                    distanceValue: distances[index].distance.value,
                    available_bikes: dynamicStation ? dynamicStation.available_bikes : 'N/A',
                    available_bike_stands: dynamicStation ? dynamicStation.available_bike_stands : 'N/A'
                };
            });
        
            // Sort by walking distance
            distanceData.sort((a, b) => a.distanceValue - b.distanceValue);

            // Top 5 closest stations
            let closestStations = distanceData.slice(0, 5);

            // Populate the dropdown with the closest stations
            let userLocation = new google.maps.LatLng(userLatitude, userLongitude);
            populateDropdownWithStations(closestStations, userLocation, map);
        }
    });
}

// ---------------------DISTANCE FUNCTIONS END-------------------------------------------
// =======================================================================================


// =======================================================================================
// ---------------------SEARCHBAR LIST DROPDOWN ------------------------------------------
// Function to populate the dropdown with the closest stations
function populateDropdownWithStations(closestStations, userLocation, map) {
    let dropdown = document.getElementById('dropdown-content');
    dropdown.innerHTML = ''; 

    closestStations.forEach(station => {
        let option = document.createElement('button'); 
        option.innerHTML = `
            <div class="station-info">
                <span class="station-name"><b>${station.place_address}</b></span>
                <span class="station-distance"><b>Distance:</b> ${station.distance}</span>
                <span class="station-bikes"><b>Bikes:</b> ${station.available_bikes}</span>
                <span class="station-bike-stands"><b>Stands:</b> ${station.available_bike_stands}</span>
            </div>
        `;
        // Add event listener for clicking a station
        option.addEventListener('click', () => {
            console.log(`Station selected: ${station.place_name}`);
            calculateAndDisplayRoute(directionsService, directionsRenderer, userLocation, station, map);
        });
        dropdown.appendChild(option);
    });

    // Make sure the directions are rendered on the map
    directionsRenderer.setMap(map);
}
// ---------------------SEARCHBAR LIST DROPDOWN END--------------------------------------
// =======================================================================================


// =======================================================================================
// ---------------------ROUTE FUNCTIONS --------------------------------------------------
// Define the function to calculate and display the route
function calculateAndDisplayRoute(directionsService, directionsRenderer, userLocation, station, map) {
    directionsService.route({
        origin: userLocation,
        destination: new google.maps.LatLng(station.place_latitude, station.place_longitude),
        travelMode: 'WALKING'
    }, (response, status) => {
        if (status === 'OK') {
            directionsRenderer.setDirections(response);
        } else {
            window.alert('Directions request failed due to ' + status);
        }
    });
}
// ---------------------ROUTE FUNCTIONS END----------------------------------------------
// =======================================================================================


// #####################  FUNCTIONS FOR THE SEARCH BAR  #######################################
// ============================================================================================


// =======================================================================================
// ---------------------MAP INITIALISATION -----------------------------------------------
window.initMap = async function initMap() {
    try {
        const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");
        let dublin = { lat: 53.3498, lng: -6.2603 };

        const map = new google.maps.Map(document.getElementById('map'), {
            zoom: 13,
            center: dublin,
            mapId: 'BIKES_MAP',
        });

        // Directions service and renderer
        directionsService = new google.maps.DirectionsService();
        directionsRenderer = new google.maps.DirectionsRenderer();
        directionsRenderer.setMap(map);

        // Fetch static data
        const staticResponse = await fetch('/stations_static');
        const staticData = await staticResponse.json(); 
        // Fetch dynamic data
        const dynamicResponse = await fetch('/stations_dynamic');
        const dynamicData = await dynamicResponse.json();

        // Set up the autocomplete and Map markers
        setupAutocomplete(map, staticData, dynamicData);
        addMarkers(staticData, dynamicData, PinElement, AdvancedMarkerElement, map);
    } catch (error) {
        console.error('Error initializing map:', error);
    }
}
// ---------------------MAP INITIALISATION END-------------------------------------------
//=======================================================================================


// =======================================================================================
// ---------------------MAP MARKER FUNCTIONS ---------------------------------------------
function addMarkers(staticData, dynamicData, PinElement, AdvancedMarkerElement, map) {  
        const infoWindow = new google.maps.InfoWindow();
        // For each station in the static data
        staticData.forEach(staticStation => {

            // The corresponding station in the dynamic data
            let dynamicStation = dynamicData.find(dynamic => dynamic.id === staticStation.place_id);

            // If a corresponding station is found
            if (dynamicStation) {
                let pin = new PinElement({
                    background: '#ff0000',
                    borderColor: '#000000',
                    glyph: '',
                    glyphColor: '#ffffff',
                    scale: 1
                });

                // Custom HTML element for each marker
                let markerElement = new AdvancedMarkerElement({
                    map: map,
                    position: new google.maps.LatLng(parseFloat(staticStation.place_latitude), parseFloat(staticStation.place_longitude)),
                    content: pin.element,
                    gmpClickable: true,
                    title: staticStation.place_name
                });

                // Click listener for each marker
                markerElement.addListener('gmp-click', function() {
                    const contentString = 
                    `<div id="content">
                        <h3>${staticStation.place_address}</h3>
                        <p><b>Status:</b> ${dynamicStation.status}</p>       
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
}
// ---------------------MAP MARKER FUNCTIONS END-----------------------------------------
//=======================================================================================


//###########################################################################################
// ---------------------ONLOAD FUNCTIONS ----------------------------------------------------
// Make sure the map and sidebars are loaded before running the following code
window.addEventListener('load', function() {
    initMap();

    document.getElementById('rightSidebar').style.transform = 'translateX(100%)';
    document.getElementById('rightSidebar').style.transition = 'transform 0.5s ease-in-out';

    // Right sidebar toggle button
    document.getElementById('toggle-right-sidebar').addEventListener('click', function() {
        var rightSidebar = document.getElementById('rightSidebar');
        if (rightSidebar.style.transform === 'translateX(100%)') {
            rightSidebar.style.transform = 'translateX(0)';
        } else {
            rightSidebar.style.transform = 'translateX(100%)';
        }
    });

    // Not sure if we need this but could be used for the stats 
    fetch('/stations_dynamic')
        .then(response => response.json())
        .then(data => {
            // Process bike data and add to bike div
            var bikeInfo = document.createElement('p');
            bikeInfo.textContent = 'Bike Info: ' + JSON.stringify(data);
            document.getElementById('bike-data').appendChild(bikeInfo);
        })
        .catch(error => console.error('Error:', error));

    //=======================================================================================
    // ---------------------WEATHER FUNCTION ------------------------------------------------
    //TODO: FIX
    fetch('/weather')
        .then(response => response.json())
        .then(data => {
            // Div to hold the weather data
            var weatherDiv = document.createElement('div');
            weatherDiv.className = 'weather';

            // Elements for each piece of weather data
            var mainEvent = document.createElement('p');
            mainEvent.textContent = 'Main Event: ' + data.main_event;
            if (data.main_event !== NaN && data.main_event !== undefined) {
            weatherDiv.appendChild(mainEvent);
            }

            var temperature = document.createElement('p');
            temperature.textContent = 'Temperature: ' + data.temperature + '°C';
            weatherDiv.appendChild(temperature);

            var description = document.createElement('p');
            description.textContent = 'Description: ' + data.description;
            weatherDiv.appendChild(description);

            // Add the weather div to the right sidebar
            var rightSidebar = document.getElementById('weather-data');
            rightSidebar.appendChild(weatherDiv);
        })
        .catch(error => console.error('Error:', error));

    //=======================================================================================
    // ---------------------WEATHER FUNCTION ------------------------------------------------
});

// ---------------------ONLOAD FUNCTIONS END-------------------------------------------------
//###########################################################################################




//=======================================================================================
// ---------------------TIME FUNCTION ---------------------------------------------------
function updateTime() {
    document.getElementById('current-time').textContent = new Date().toLocaleTimeString();
}
setInterval(updateTime, 1000);

// ---------------------TIME FUNCTION END------------------------------------------------
//=======================================================================================


//=======================================================================================
// ---------------------SIDEBAR FUNCTIONS -----------------------------------------------


// ---------------------SIDEBAR FUNCTIONS END--------------------------------------------
//=======================================================================================



