// GMaps API implementation 
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
    // Autocomplete for user location input
    var input = document.getElementById('user-location');
    var autocomplete = new google.maps.places.Autocomplete(input);
}

function updateTime() {
    document.getElementById('current-time').textContent = new Date().toLocaleTimeString();
}
setInterval(updateTime, 1000);

document.getElementById('left-sidebar').addEventListener('click', function() {
    this.style.display = this.style.display === 'none' ? '' : 'none';
});

document.getElementById('right-sidebar').addEventListener('click', function() {
    this.style.display = this.style.display === 'none' ? '' : 'none';
});