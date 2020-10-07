/* Note: This example requires that you consent to location sharing when
    * prompted by your browser. If you see the error "Geolocation permission
    * denied.", it means you probably did not give permission for the browser * to locate you. */
let pos;
let map;
let bounds;
let infoWindow;
let currentInfoWindow;
let service;
let infoPane;
let directionService;
let poly;
let markers = [];

function initMap() {
    bounds = new google.maps.LatLngBounds();
    infoWindow = new google.maps.InfoWindow;
    currentInfoWindow = infoWindow;
    infoPane = document.getElementById('panel');

    /* Try HTML5 geolocation */
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            map = new google.maps.Map(document.getElementById('map'), {
                center: pos,
                zoom: 150,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            });
            let marker = new google.maps.Marker({
                position: pos,
                map: map,
                title: "Current location",
                animation: google.maps.Animation.DROP,
                icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                draggable: true
            });
            google.maps.event.addListener(marker, 'dragend', (event) => {
                /* TODO: clear all other paths and markers */
                clearMap();
                createDestinationRouteFromCurrentPos(event.latLng.lat(), event.latLng.lng());
            });
            bounds.extend(pos);

            createDestinationRouteFromCurrentPos(pos.lat, pos.lng);

        }, () => {
            /* Browser supports geolocation, but user has denied permission */
            handleLocationError(true, infoWindow);
        });
    }
    else {
        /* Browser doesn't support geolocation */
        handleLocationError(false, infoWindow);
    }

}

function clearMap() {
    for (let i = 0; i < markers.length; i++) {
        console.log(i);
        markers[i].setMap(null);
    }
    markers = [];
    poly.setMap(null);
}

function createDestinationRouteFromCurrentPos(lat, lng) {
    /* set test route from current location to test location Lat/Long */
    let destination = {
        "timestamp": 'Destination',
        "latitude": '27.815579',
        "longitude": '-97.389245',
        "description": 'Near the USS Lexington'
    }

    let path = new google.maps.MVCArray();
    directionService = new google.maps.DirectionsService();
    poly = new google.maps.Polyline({ map: map, strokeColor: '#4986E7' });
    
    let myLatlng = new google.maps.LatLng(destination.latitude, destination.longitude);
    let marker = new google.maps.Marker({
        position: myLatlng,
        map: map,
        title: destination.timestamp,
        animation: google.maps.Animation.DROP,
        icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
    });
    markers.push(marker);
    bounds.extend(myLatlng);

    /* Set the path from current location to Austin TX */
    let src = new google.maps.LatLng(lat, lng);
    poly.setPath(path);
    directionService.route({
        origin: src,
        destination: myLatlng,
        travelMode: google.maps.DirectionsTravelMode.DRIVING
    }, (result, status) => {
        if (status == google.maps.DirectionsStatus.OK) {
            for (let i = 0, len = result.routes[0].overview_path.length; i < len; i++) {
                path.push(result.routes[0].overview_path[i]);
            }

            /* 60 miles in meters. TODO: Convert later */
            let points = poly.GetPointsAtDistance(96560);
            for (let i = 0; i < points.length; i++) {
                console.log("points: " + i);
                let lat_lng = points[i];
                /* put marker at lat_lng */
                let marker = new google.maps.Marker({
                    position: lat_lng,
                    map: map,
                    title: "Example title",
                    visible: false /* invisible for the time being */
                });
                markers.push(marker);

                /* create markers for nearby gas stations at each invisible marker */
                getNearbyPlaces(marker.position);
            }
        }
    });
}

/* Handle a geolocation error */
function handleLocationError(browserHasGeolocation, infoWindow) {
    /* Set default location to Sydney, Australia */
    pos = { lat: -33.856, lng: 151.215 };
    map = new google.maps.Map(document.getElementById('map'), {
        center: pos,
        zoom: 15
    });

    /* Display an InfoWindow at the map center */
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
    'Geolocation permissions denied. Using default location.' :
    'Error: Your browser doesn\'t support geolocation.');
    infoWindow.open(map);
    currentInfoWindow = infoWindow;

    /* Call Places Nearby Search on the default location */
    getNearbyPlaces(pos);
}

/* Perform a Places Nearby Search Request */
function getNearbyPlaces(position) {
    let request = {
        location: position,
        rankBy: google.maps.places.RankBy.DISTANCE,
        type: 'gas_station'
    };

    service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, nearbyCallback);
}

/* Handle the results (up to 20) of the Nearby Search */
function nearbyCallback(results, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        createMarkers(results);
    }
    else if (status == google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
        /* too many requests per second. maybe
        queue up the failed requests and try again
        in a few seconds? Ignore for now. */
    }
    else {
        console.log("Status: " + status);
    }
}

/* Set markers at the location of each place result */
function createMarkers(places) {
    places.forEach(place => {
        let marker = new google.maps.Marker({
            position: place.geometry.location,
            map: map,
            title: place.name
        });
        markers.push(marker);

        google.maps.event.addListener(marker, 'click', () => {
            let request = {
                placeId: place.place_id,
                fields: ['name', 'formatted_address', 'geometry', 'rating',
                    'website', 'photos']
            };

            /* Only fetch the details of a place when the user clicks on a marker.
            * If we fetch the details for all place results as soon as we get
            * the search response, we will hit API rate limits. */
            service.getDetails(request, (placeResult, status) => {
                showDetails(placeResult, marker, status)
            });
        });

        /* Adjust the map bounds to include the location of this marker */
        bounds.extend(place.geometry.location);
    });

    /* Once all the markers have been placed, adjust the bounds of the map to
    * show all the markers within the visible area. */
    map.fitBounds(bounds);
}

/* Builds an InfoWindow to display details above the marker */
function showDetails(placeResult, marker, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        let placeInfowindow = new google.maps.InfoWindow();
        let rating = "None";
    if (placeResult.rating) rating = placeResult.rating;
        placeInfowindow.setContent('<div><strong>' + placeResult.name +
            '</strong><br>' + 'Rating: ' + rating + '</div>');
        placeInfowindow.open(marker.map, marker);
        currentInfoWindow.close();
        currentInfoWindow = placeInfowindow;
        showPanel(placeResult);
    } else {
        console.log('showDetails failed: ' + status);
    }
}

/* Displays place details in a sidebar */
function showPanel(placeResult) {
    /* If infoPane is already open, close it */
    if (infoPane.classList.contains("open")) {
        infoPane.classList.remove("open");
    }

    /* Clear the previous details */
    while (infoPane.lastChild) {
        infoPane.removeChild(infoPane.lastChild);
    }

    if (placeResult.photos) {
        let firstPhoto = placeResult.photos[0];
        let photo = document.createElement('img');
        photo.classList.add('hero');
        photo.src = firstPhoto.getUrl();
        infoPane.appendChild(photo);
    }

    /* Add place details with text formatting */
    let name = document.createElement('h1');
    name.classList.add('place');
    name.textContent = placeResult.name;
    infoPane.appendChild(name);
    if (placeResult.rating) {
        let rating = document.createElement('p');
        rating.classList.add('details');
        rating.textContent = `Rating: ${placeResult.rating} \u272e`;
        infoPane.appendChild(rating);
    }
    let address = document.createElement('p');
    address.classList.add('details');
    address.textContent = placeResult.formatted_address;
    infoPane.appendChild(address);
    if (placeResult.website) {
        let websitePara = document.createElement('p');
        let websiteLink = document.createElement('a');
        let websiteUrl = document.createTextNode(placeResult.website);
        websiteLink.appendChild(websiteUrl);
        websiteLink.title = placeResult.website;
        websiteLink.href = placeResult.website;
        websitePara.appendChild(websiteLink);
        infoPane.appendChild(websitePara);
    }

    let buttonParagraph = document.createElement('p');
    buttonParagraph.classList.add('details');
    let closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.textContent = 'close';
    closeButton.addEventListener('click', (event) => {
        if (infoPane.classList.contains("open")) {
            infoPane.classList.remove("open");
        }
    
        while (infoPane.lastChild) {
            infoPane.removeChild(infoPane.lastChild);
        }
    });
    buttonParagraph.appendChild(closeButton);
    infoPane.appendChild(buttonParagraph);

    /* Open the infoPane */
    infoPane.classList.add("open");
}