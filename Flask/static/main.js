//###########################################################################################
// ---------------------ONLOAD FUNCTIONS ------------------------------------------------
window.addEventListener('load', function() {
    async function initMap() {
        try {
            const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");
            let dublin = { lat: 53.3498, lng: -6.2603 };

            const map = new google.maps.Map(document.getElementById('map'), {
                zoom: 13,
                center: dublin,
                mapId: 'BIKES_MAP',
            });

            // Info window for each marker
            const infoWindow = new google.maps.InfoWindow();

            // Fetch static data
            const staticResponse = await fetch('/stations_static');
            const staticData = await staticResponse.json();

            // Fetch dynamic data
            const dynamicResponse = await fetch('/stations_dynamic');
            const dynamicData = await dynamicResponse.json();

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
                        // TODO: Decide on pin icon/info
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
                            <p><b>Last Updated:</b> ${dynamicStation.api_update}</p>
                            <p><b>Available Bikes:</b> ${dynamicStation.available_bikes}</p>
                            <p><b>Available Bike Stands:</b> ${dynamicStation.available_bike_stands}</p>
                            <p><b>Total Bike Stands:</b> ${dynamicStation.bike_stands}</p>
                        </div>`;

                        // The content and position of the info window
                        infoWindow.setContent(contentString);
                        infoWindow.setPosition(new google.maps.LatLng(staticStation.place_latitude, staticStation.place_longitude));
                        infoWindow.open(map);
                    });
                }
            });
            
            setupAutocomplete(map);
        } catch (error) {
            console.error('Error initializing map:', error);
        }
    }

    //=======================================================================================
    // ---------------------SEARCHBAR FUNCTIONS ---------------------------------------------
    // Function to setup the search bar autocomplete
    function setupAutocomplete(map) {
        let searchBarInput = document.getElementById('searchBarInput');
        let searchAutocomplete = new google.maps.places.Autocomplete(searchBarInput);
        searchAutocomplete.bindTo('bounds', map);
    
        // User's selection
        searchAutocomplete.addListener('place_changed', function() {
        let place = searchAutocomplete.getPlace();
        if (!place.geometry) {
            console.log("Returned place contains no geometry");
            return;
        }

        // Move the map to the selected location 
        map.panTo(place.geometry.location);
        map.setZoom(15);

        // Nearby Search for bike stations around the selected location
        findNearestBikeStations(place.geometry.location.lat(), place.geometry.location.lng(), map);
    });
    }

    // Function to find the nearest bike stations to a location using the Places API
    function findNearestBikeStations(latitude, longitude, map) {
        let service = new google.maps.places.PlacesService(map);
        let request = {
            location: new google.maps.LatLng(latitude, longitude),
            radius: '500', // 500 meters
            keyword: 'bike station'
        };

        // Nearby Search request
        service.nearbySearch(request, function(results, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                console.log(results); 
            } else {
                console.error('Nearby Search failed: ' + status);
            }
            // Add search results to the dropdown
            populateDropdownWithStations(results);
        });
    }
    // ---------------------SEARCHBAR FUNCTIONS END-----------------------------------------
    //=======================================================================================


    //=======================================================================================
    // ---------------------DROPDOWN FUNCTION -----------------------------------------------
    // Function to populate a dropdown with search results
    //TODO: Format and grab the correct data 
    function populateDropdownWithStations(stations) {
        let dropdown = document.getElementById('dropdown-content');
        dropdown.innerHTML = ''; 
        
        stations.forEach(station => {
            let option = document.createElement('div');
            option.classList.add('dropdown-item');
            option.innerHTML = `
                <span class="station-name">${station.name}</span>
                <span class="station-status">${station.business_status}</span>
                <span class="station-distance">${station.distance} meters away</span>
                <span class="station-bikes">Bikes: ${station.available_bikes}</span>
                <span class="station-bike-stands">Stands: ${station.available_bike_stands}</span>
            `;
            // Click event for each dropdown item
            option.addEventListener('click', () => {
                // TODO: Implement function to handle the selected dropdown station
                selectStation(station);
            });
            dropdown.appendChild(option);
        });
    }
    // ---------------------DROPDOWN FUNCTION END--------------------------------------------
    //=======================================================================================

    // Call map initialization function
    initMap();

    // =======================================================================================
    // ---------------------SIDEBAR TOGGLES -----------------------------------------------
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
    // ---------------------SIDEBAR TOGGLES END---------------------------------------------
    // =======================================================================================


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
    fetch('/weather')
        .then(response => response.json())
        .then(data => {
            // Div to hold the weather data
            var weatherDiv = document.createElement('div');
            weatherDiv.className = 'weather';

            // CElements for each piece of weather data
            var mainEvent = document.createElement('p');
            mainEvent.textContent = 'Main Event: ' + data.main_event;
            weatherDiv.appendChild(mainEvent);

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
});
    // ---------------------WEATHER FUNCTION ------------------------------------------------
    //=======================================================================================

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




