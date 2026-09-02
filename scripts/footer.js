document.addEventListener(
    "DOMContentLoaded",
    () => {

        document
            .querySelectorAll(".mapButton")
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        event => {

                            event.preventDefault();

                            window.location.href =
                                new URL(
                                    "index.html",
                                    window.location.origin +
                                    window.location.pathname
                                ).href;

                        }
                    );

                }
            );

        document
            .getElementById("buildingsBtn")
            ?.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    window.location.href =
                        new URL(
                            "buildings.html",
                            window.location.origin +
                            window.location.pathname
                        ).href;

                }
            );

    }
);

