let buildings = [];

document.addEventListener("DOMContentLoaded", () => {

    const searchInput =
        document.getElementById("pageSearch");

    const results =
        document.getElementById("searchResults");

    if (!searchInput || !results) {
        return;
    }

    fetch("../../data/buildings.geojson")
        .then(response => response.json())
        .then(data => {

            buildings = data.features
                .filter(
                    feature =>
                        feature.properties?.page
                )
                .map(feature => ({
                    name:
                        feature.properties.name,
                    page:
                        feature.properties.page,
                    roomPrefix:
                        feature.properties.roomPrefix ||
                        null,
                    roomPattern:
                        feature.properties.roomPattern ||
                        null
                }));

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
                results.style.display = "none";
                return;
            }

            const searchQuery =
                query.replace(/\*/g, "");

            const matches =
                buildings.filter(building => {

                    const name =
                        building.name.toLowerCase();

                    const nameMatch =
                        name.includes(query);

                    let roomMatch = false;

                    if (
                        building.roomPrefix &&
                        searchQuery
                    ) {

                        const prefix =
                            building.roomPrefix
                                .toLowerCase();

                        roomMatch =
                            searchQuery.startsWith(
                                prefix
                            );
                    }

                    if (
                        building.roomPattern &&
                        searchQuery
                    ) {

                        const fullPattern =
                            new RegExp(
                                building.roomPattern,
                                "i"
                            );

                        roomMatch =
                            roomMatch ||
                            fullPattern.test(
                                searchQuery
                            );
                    }

                    return (
                        nameMatch ||
                        roomMatch
                    );
                });

            matches.forEach(building => {

                const result =
                    document.createElement("div");

                result.className =
                    "search-result";

                result.textContent =
                    building.name;

                result.addEventListener(
                    "click",
                    () => {

                        window.location.href =
                            "../../" +
                            building.page;

                    }
                );

                results.appendChild(result);

            });

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

});