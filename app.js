const southWest = L.latLng(-37.63012, 143.88818);
const northEast = L.latLng(-37.62208, 143.89760);

const campusBounds = L.latLngBounds(
    southWest,
    northEast
);

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


const sharedRouter = L.Routing.osrmv1({

    serviceUrl:
        "https://routing.openstreetmap.de/routed-foot/route/v1"

});


let userLatLng = null;
let userMarker = null;

let routingControl = null;
let destinationMarker = null;

let currentDestination = null;
let currentDestinationName = "Destination";

let lastRoutePosition = null;

let routeRequestId = 0;
let routeRequestInProgress = false;

const ROUTE_UPDATE_DISTANCE = 5;
const MAX_GPS_ACCURACY = 50;


function updateUserLocation(lat, lng, accuracy) {

    const newPosition = L.latLng(lat, lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return;
    }

    if (
        Number.isFinite(accuracy) &&
        accuracy > MAX_GPS_ACCURACY
    ) {
        return;
    }

    if (!campusBounds.contains(newPosition)) {
        return;
    }

    userLatLng = newPosition;

    if (!userMarker) {

        userMarker = L.circleMarker(
            userLatLng,
            {
                radius: 10,
                fillColor: "#007bff",
                color: "#fff",
                weight: 3,
                fillOpacity: 1
            }
        ).addTo(map);

        map.setView(userLatLng, 18);

    } else {

        userMarker.setLatLng(userLatLng);

    }

    if (!currentDestination) {
        return;
    }

    if (!lastRoutePosition) {

        updateRouteFromCurrentLocation();
        return;

    }

    const distanceMoved =
        map.distance(
            lastRoutePosition,
            userLatLng
        );

    if (
        distanceMoved >= ROUTE_UPDATE_DISTANCE &&
        !routeRequestInProgress
    ) {

        updateRouteFromCurrentLocation();

    }

}


if (navigator.geolocation) {

    navigator.geolocation.watchPosition(

        position => {

            updateUserLocation(
                position.coords.latitude,
                position.coords.longitude,
                position.coords.accuracy
            );

        },

        error => {

            console.warn(
                "GPS error:",
                error.message
            );

        },

        {
            enableHighAccuracy: true,
            maximumAge: 1000,
            timeout: 10000
        }

    );

} else {

    console.warn(
        "Geolocation is not supported by this browser."
    );

}


function createRoute(
    destination,
    name = "Destination"
) {

    if (!userLatLng) {

        alert(
            "Waiting for GPS location..."
        );

        return;

    }

    currentDestination = destination;
    currentDestinationName = name;

    lastRoutePosition = null;

    routeRequestId++;

    routeRequestInProgress = false;

    if (destinationMarker) {

        map.removeLayer(
            destinationMarker
        );

    }

    destinationMarker =
        L.marker(destination)
            .addTo(map)
            .bindPopup(name)
            .openPopup();

    if (routingControl) {

        map.removeControl(
            routingControl
        );

        routingControl = null;

    }

    updateRouteFromCurrentLocation();

}


function updateRouteFromCurrentLocation() {

    if (
        !userLatLng ||
        !currentDestination ||
        routeRequestInProgress
    ) {
        return;
    }

    const routeStart =
        L.latLng(
            userLatLng.lat,
            userLatLng.lng
        );

    const requestId =
        ++routeRequestId;

    routeRequestInProgress = true;

    const newRoutingControl =
        L.Routing.control({

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

            collapsible: false,

            itineraryBuilder: false,


            createMarker: () => null,

            lineOptions: {

                styles: [
                    {
                        color: "#007bff",
                        weight: 6,
                        opacity: 0.9
                    }
                ]

            }

        });


    newRoutingControl.on(
        "routesfound",
        () => {

            if (requestId !== routeRequestId) {

                map.removeControl(
                    newRoutingControl
                );

                return;

            }

            if (routingControl) {

                map.removeControl(
                    routingControl
                );

            }

            routingControl =
                newRoutingControl;

            lastRoutePosition =
                routeStart;

            routeRequestInProgress =
                false;

        }
    );


    newRoutingControl.on(
        "routingerror",
        error => {

            if (
                requestId === routeRequestId
            ) {

                console.warn(
                    "Routing error:",
                    error.error
                );

                routeRequestInProgress =
                    false;

            }

            map.removeControl(
                newRoutingControl
            );

        }
    );


    newRoutingControl.addTo(map);

}


function routeToBuilding(
    lat,
    lng,
    name
) {

    createRoute(
        L.latLng(lat, lng),
        name
    );

}


let buildingLayer = null;


fetch(
    "data/buildings.geojson"
)
    .then(response => {

        if (!response.ok) {

            throw new Error(
                `Failed to load buildings.geojson: ${response.status}`
            );

        }

        return response.json();

    })
    .then(data => {

        buildingLayer =
            L.geoJSON(
                data,
                {

                    style: () => ({

                        color: "#007bff",

                        weight: 2,

                        fillColor: "#007bff",

                        fillOpacity: 0.2

                    }),

                    onEachFeature: (
                        feature,
                        layer
                    ) => {

                        const name =
                            feature.properties?.name ||
                            "Building";

                        const pageUrl =
                            feature.properties?.page ||
                            null;


                        layer.on(
                            "click",
                            event => {

                                const clicked =
                                    event.latlng;


                                const popup =
                                    document.createElement(
                                        "div"
                                    );

                                popup.style.textAlign =
                                    "center";

                                popup.style.minWidth =
                                    "180px";


                                const heading =
                                    document.createElement(
                                        "h3"
                                    );

                                heading.textContent =
                                    name;


                                const openButton =
                                    document.createElement(
                                        "button"
                                    );

                                openButton.textContent =
                                    "Open Building";

                                openButton.style.width =
                                    "100%";

                                openButton.style.marginBottom =
                                    "10px";

                                openButton.style.padding =
                                    "10px";

                                openButton.style.border =
                                    "none";

                                openButton.style.borderRadius =
                                    "8px";

                                openButton.style.background =
                                    "#007bff";

                                openButton.style.color =
                                    "white";


                                if (pageUrl) {

                                    openButton.addEventListener(
                                        "click",
                                        () => {

                                            window.location.href =
                                                pageUrl;

                                        }
                                    );

                                } else {

                                    openButton.disabled =
                                        true;

                                }


                                const directionsButton =
                                    document.createElement(
                                        "button"
                                    );

                                directionsButton.textContent =
                                    "Directions";

                                directionsButton.style.width =
                                    "100%";

                                directionsButton.style.padding =
                                    "10px";

                                directionsButton.style.border =
                                    "none";

                                directionsButton.style.borderRadius =
                                    "8px";

                                directionsButton.style.background =
                                    "#28a745";

                                directionsButton.style.color =
                                    "white";


                                directionsButton.addEventListener(
                                    "click",
                                    () => {

                                        routeToBuilding(
                                            clicked.lat,
                                            clicked.lng,
                                            name
                                        );

                                    }
                                );


                                popup.appendChild(
                                    heading
                                );

                                popup.appendChild(
                                    openButton
                                );

                                popup.appendChild(
                                    directionsButton
                                );


                                layer
                                    .bindPopup(popup)
                                    .openPopup(
                                        clicked
                                    );

                            }
                        );

                    }

                }
            )
            .addTo(map);

    })
    .catch(error => {

        console.error(
            "Building data error:",
            error
        );

    });


map.on(
    "click",
    event => {

        const clicked =
            event.latlng;

        let clickedBuilding = false;

        if (buildingLayer) {

            buildingLayer.eachLayer(
                layer => {

                    if (
                        clickedBuilding ||
                        !layer.getBounds
                    ) {
                        return;
                    }

                    if (
                        layer
                            .getBounds()
                            .contains(clicked)
                    ) {

                        clickedBuilding = true;

                    }

                }
            );

        }

        if (!clickedBuilding) {

            createRoute(
                clicked,
                "Custom Destination"
            );

        }

    }
);


map.on(
    "drag",
    () => {

        map.panInsideBounds(
            campusBounds,
            {
                animate: false
            }
        );

    }
);