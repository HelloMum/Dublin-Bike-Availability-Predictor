//=======================================================================================
//  ---------------------ONLOAD FUNCTIONS -----------------------------------------------
window.addEventListener('load', function() {
    function initMap() {
        var dublin = { lat: 53.3498, lng: -6.2603 };
        var map = new google.maps.Map(document.getElementById('map'), {
            zoom: 13,
            center: dublin
        });

        // Markers on the map for each station
        for (var i = 0; i < stations.length; i++) {
            var station = stations[i];
            var marker = new google.maps.Marker({
                position: { lat: station.latitude, lng: station.longitude },
                map: map,
                title: station.name
            });
        }

    // Autocomplete for the search bar
    var searchBarInput = document.getElementById('searchBarinput'); 
    var searchAutocomplete = new google.maps.places.Autocomplete(searchBarInput);

    // bound the autocomplete to prefer results within the map's viewport
    searchAutocomplete.bindTo('bounds', map);
    }

    // hide the right sidebar
    document.getElementById('rightSidebar').style.display = 'none';

    // Call the initMap function
    initMap();
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
// Set the initial display of the sidebars left = show right = hidden
document.getElementById('leftSidebar').style.display = '';
document.getElementById('rightSidebar').style.display = 'none';

// Right sidebar toggle button
document.getElementById('toggle-right-sidebar').addEventListener('click', function() {
    var rightSidebar = document.getElementById('rightSidebar');
    if (rightSidebar.style.display === 'none') {
        rightSidebar.style.display = 'block';
    } else {
        rightSidebar.style.display = 'none';
    }
});
// ---------------------SIDEBAR FUNCTIONS END--------------------------------------------
//=======================================================================================



//=======================================================================================
// ---------------------WEATHER FUNCTION ------------------------------------------------
window.onload = function() {
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
            var rightSidebar = document.getElementById('rightSidebar');
            rightSidebar.appendChild(weatherDiv);
        })
        .catch(error => console.error('Error:', error));
};
//=======================================================================================
// ---------------------WEATHER FUNCTION ------------------------------------------------