document.addEventListener(
    "DOMContentLoaded",
    () => {

        const script =
            document.querySelector(
                'script[src$="scripts/footer.js"]'
            );

        if (!script) {
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


        document
            .querySelectorAll(".mapButton")
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            window.location.href =
                                new URL(
                                    "wayfinderapp.html",
                                    projectRoot
                                ).href;

                        }
                    );

                }
            );


        document
            .getElementById("buildingsBtn")
            ?.addEventListener(
                "click",
                () => {

                    window.location.href =
                        new URL(
                            "buildings.html",
                            projectRoot
                        ).href;

                }
            );

    }
);