window.addEventListener('load', function() {
    var map; 

    function initMap() {
        var dublin = { lat: 53.3498, lng: -6.2603 };
        map = new google.maps.Map(document.getElementById('map'), {
            zoom: 13,
            center: dublin
        });

        fetch('/stations_dynamic') 
            .then(response => response.json())
            .then(data => {
                data.forEach(function(station) {
                    var marker = new google.maps.Marker({
                        position: { lat: station.latitude, lng: station.longitude },
                        map: map,
                        icon: {
                            url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                            strokeWeight: 1,
                        },
                        title: `${station.name} - Available Bikes: ${station.available_bikes}`
                    });
                });

            // SetupAutocomplete within initMap or after ensuring map is loaded
            setupAutocomplete();
            })            
            .catch(error => console.error('Error loading station data:', error));
    }

    // Call the initMap function
    initMap();

    // GMAPS autocomplete location 
    function setupAutocomplete() {
        var searchBarInput = document.getElementById('searchBarInput'); 
        var searchAutocomplete = new google.maps.places.Autocomplete(searchBarInput);

        // Bound the autocomplete to prefer results within the map's viewport
        searchAutocomplete.bindTo('bounds', map);
    }


    // Hide the right sidebar initially
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
    //=======================================================================================
    // ---------------------WEATHER FUNCTION ------------------------------------------------
});

// ---------------------ONLOAD FUNCTIONS END---------------------------------------------
//=======================================================================================


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

// find closet station based on user input and populate the dropdown with results
function findClosestStation() {
    var searchInput = document.getElementById('searchBarInput').value;
    var dropdownContent = document.querySelector('.dropdown-content');
    dropdownContent.innerHTML = '';
    fetch(`/closest_station?search=${searchInput}`)
        .then(response => response.json())
        .then(data => {
            data.forEach(function(station) {
                var stationDiv = document.createElement('div');
                stationDiv.textContent = station.name;
                stationDiv.addEventListener('click', function() {
                    var stationName = stationDiv.textContent;
                    var stationInfo = document.createElement('p');
                    stationInfo.textContent = stationName;
                    document.getElementById('station-info').innerHTML = '';
                    document.getElementById('station-info').appendChild(stationInfo);
                });
                dropdownContent.appendChild(stationDiv);
            });
        })
        .catch(error => console.error('Error:', error));

}
// ---------------------SIDEBAR FUNCTIONS END--------------------------------------------
//=======================================================================================



