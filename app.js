//
// ============================================
// CAMPUS BOUNDS
//

const southWest = L.latLng(-37.63012, 143.88818);
const northEast = L.latLng(-37.62208, 143.89760);
const campusBounds = L.latLngBounds(southWest, northEast);

//
// ============================================
// MAP INIT
//

const map = L.map("map", {
    center: [
        (southWest.lat + northEast.lat) / 2,
        (southWest.lng + northEast.lng) / 2
    ],
    zoom: 17,
    minZoom: 16,
    maxZoom: 18,
    maxBounds: campusBounds,
    maxBoundsViscosity: 1.0
});

map.attributionControl.setPrefix(false);

//
// ============================================
// BASE MAP
//

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

//
// ============================================
// ROUTER
//

const sharedRouter = L.Routing.osrmv1({
    serviceUrl: "https://routing.openstreetmap.de/routed-foot/route/v1"
});

//
// ============================================
// STATE
//

let userLatLng = null;
let userMarker = null;

let routingControl = null;
let destinationMarker = null;

let currentDestination = null;
let currentDestinationName = "Destination";

let lastRoutePosition = null;

const ROUTE_UPDATE_DISTANCE = 5;

//
// ============================================
// USER LOCATION
//

function updateUserLocation(lat, lng, accuracy) {

    const newPosition = L.latLng(lat, lng);

    userLatLng = newPosition;

    if (!campusBounds.contains(userLatLng)) {
        return;
    }

    if (!userMarker) {

        userMarker = L.circleMarker(userLatLng, {
            radius: 10,
            fillColor: "#007bff",
            color: "#fff",
            weight: 3,
            fillOpacity: 1
        }).addTo(map);

        map.setView(userLatLng, 18);

    } else {

        userMarker.setLatLng(userLatLng);

    }

    if (currentDestination) {

        if (!lastRoutePosition) {

            updateRouteFromCurrentLocation();

        } else {

            const distanceMoved =
                map.distance(lastRoutePosition, userLatLng);

            if (distanceMoved >= ROUTE_UPDATE_DISTANCE) {
                updateRouteFromCurrentLocation();
            }
        }
    }
}

if (navigator.geolocation) {

    navigator.geolocation.watchPosition(
        pos => updateUserLocation(
            pos.coords.latitude,
            pos.coords.longitude,
            pos.coords.accuracy
        ),
        console.log,
        {
            enableHighAccuracy: true,
            maximumAge: 1000,
            timeout: 10000
        }
    );
}

//
// ============================================
// ROUTING
//

function createRoute(destination, name = "Destination") {

    if (!userLatLng) {
        alert("Waiting for GPS location...");
        return;
    }

    currentDestination = destination;
    currentDestinationName = name;

    lastRoutePosition = null;

    if (destinationMarker) {
        map.removeLayer(destinationMarker);
    }

    destinationMarker = L.marker(destination)
        .addTo(map)
        .bindPopup(name)
        .openPopup();

    updateRouteFromCurrentLocation();
}

function updateRouteFromCurrentLocation() {

    if (!userLatLng || !currentDestination) {
        return;
    }

    const routeStart = L.latLng(
        userLatLng.lat,
        userLatLng.lng
    );

    lastRoutePosition = routeStart;

    const newRoutingControl = L.Routing.control({

        waypoints: [
            routeStart,
            currentDestination
        ],

        router: sharedRouter,

        routeWhileDragging: false,
        addWaypoints: false,
        draggableWaypoints: false,

        fitSelectedRoutes: false,

        show: false,

        createMarker: () => null,

        lineOptions: {
            styles: [{
                color: "#007bff",
                weight: 6,
                opacity: 0.9
            }]
        }

    });

    newRoutingControl.on("routesfound", () => {

        if (routingControl) {
            map.removeControl(routingControl);
        }

        routingControl = newRoutingControl;

        newRoutingControl.addTo(map);
    });

    newRoutingControl.on("routingerror", () => {
        map.removeControl(newRoutingControl);
    });

    newRoutingControl.addTo(map);
}

function routeToBuilding(lat, lng, name) {

    createRoute(
        L.latLng(lat, lng),
        name
    );
}

//
// ============================================
// BUILDINGS
//

fetch("data/buildings.geojson")
    .then(res => res.json())
    .then(data => {

        L.geoJSON(data, {

            style: () => ({
                color: "#007bff",
                weight: 2,
                fillColor: "#007bff",
                fillOpacity: 0.2
            }),

            onEachFeature(feature, layer) {

                const name =
                    feature.properties?.name || "Building";

                const pageUrl =
                    feature.properties?.page ||
                    "Buildings/_TEST/error.html";

                layer.on("click", e => {

                    const clicked = e.latlng;

                    layer.bindPopup(`
                        <div style="text-align:center;min-width:180px;">

                            <h3>${name}</h3>

                            <button
                                onclick="window.location.href='${pageUrl}'"
                                style="width:100%;margin-bottom:10px;padding:10px;border:none;border-radius:8px;background:#007bff;color:white;">
                                Open Building
                            </button>

                            <button
                                onclick="routeToBuilding(${clicked.lat},${clicked.lng},'${name}')"
                                style="width:100%;padding:10px;border:none;border-radius:8px;background:#28a745;color:white;">
                                Directions
                            </button>

                        </div>
                    `);

                    layer.openPopup(clicked);
                });
            }

        }).addTo(map);
    });

//
// ============================================
// MAP CLICK
//

map.on("click", e => {

    const clicked = e.latlng;

    const clickedBuilding = [
        ...map._layers
            ? Object.values(map._layers)
            : []
    ].some(layer =>
        layer.feature &&
        layer.getBounds?.().contains(clicked)
    );

    if (!clickedBuilding) {
        createRoute(
            clicked,
            "Custom Destination"
        );
    }
});

//
// ============================================
// BOUNDARY LOCK
//

map.on("drag", () => {
    map.panInsideBounds(
        campusBounds,
        {
            animate: false
        }
    );
});