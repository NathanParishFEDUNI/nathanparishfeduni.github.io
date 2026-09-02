let buildings = [];

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const searchInput =
            document.getElementById(
                "pageSearch"
            );

        const results =
            document.getElementById(
                "searchResults"
            );

        if (
            !searchInput ||
            !results
        ) {
            return;
        }


        const script =
            document.querySelector(
                'script[src$="scripts/search.js"]'
            );

        if (!script) {

            console.error(
                "Unable to determine search.js location."
            );

            return;

        }


        const scriptUrl =
            new URL(
                script.src,
                document.baseURI
            );


        const projectRoot =
            new URL(
                "../",
                scriptUrl
            );


        const dataUrl =
            new URL(
                "../data/buildings.geojson",
                scriptUrl
            );


        fetch(dataUrl)
            .then(response => {

                if (!response.ok) {

                    throw new Error(
                        `Failed to load buildings.geojson: ${response.status}`
                    );

                }

                return response.json();

            })
            .then(data => {

                buildings =
                    data.features
                        .filter(
                            feature =>
                                feature.properties?.page
                        )
                        .map(
                            feature => {

                                const properties =
                                    feature.properties;

                                return {

                                    name:
                                        properties.name ||
                                        "Building",

                                    page:
                                        properties.page,

                                    roomPrefix:
                                        properties.roomPrefix ||
                                        null,

                                    roomPattern:
                                        properties.roomPattern ||
                                        null

                                };

                            }
                        );

            })
            .catch(error => {

                console.error(
                    "Search data error:",
                    error
                );

            });


        searchInput.addEventListener(
            "input",
            () => {

                const query =
                    searchInput.value
                        .trim()
                        .toLowerCase();


                results.innerHTML = "";


                if (!query) {

                    results.style.display =
                        "none";

                    return;

                }


                const matches =
                    buildings.filter(
                        building => {

                            const name =
                                building.name
                                    .toLowerCase();


                            if (
                                name.includes(query)
                            ) {

                                return true;

                            }


                            if (
                                building.roomPrefix
                            ) {

                                const prefix =
                                    building.roomPrefix
                                        .toLowerCase();

                                if (
                                    query.startsWith(
                                        prefix
                                    )
                                ) {

                                    return true;

                                }

                            }


                            if (
                                building.roomPattern
                            ) {

                                try {

                                    const pattern =
                                        new RegExp(
                                            building.roomPattern,
                                            "i"
                                        );

                                    if (
                                        pattern.test(query)
                                    ) {

                                        return true;

                                    }

                                } catch (error) {

                                    console.warn(
                                        "Invalid room pattern:",
                                        building.roomPattern
                                    );

                                }

                            }


                            return false;

                        }
                    );


                matches.forEach(
                    building => {

                        const result =
                            document.createElement(
                                "div"
                            );

                        result.className =
                            "search-result";

                        result.textContent =
                            building.name;


                        result.addEventListener(
                            "click",
                            () => {

                                const buildingUrl =
                                    new URL(
                                        building.page,
                                        projectRoot
                                    );

                                window.location.href =
                                    buildingUrl.href;

                            }
                        );


                        results.appendChild(
                            result
                        );

                    }
                );


                results.style.display =
                    matches.length > 0
                        ? "block"
                        : "none";

            }
        );


        document.addEventListener(
            "click",
            event => {

                if (
                    !event.target.closest(
                        ".search-bar"
                    )
                ) {

                    results.style.display =
                        "none";

                }

            }
        );

    }
);