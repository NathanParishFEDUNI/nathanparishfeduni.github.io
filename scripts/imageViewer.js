const imageViewer =
    document.getElementById("imageViewer");

const image =
    document.getElementById("floorPlan");


let scale = 1;
let minScale = 1;
let maxScale = 5;

let positionX = 0;
let positionY = 0;

let dragging = false;

let dragStartX = 0;
let dragStartY = 0;

const pointers = new Map();

let pinchStartDistance = 0;
let pinchStartScale = 1;

let pinchStartCenterX = 0;
let pinchStartCenterY = 0;

let pinchStartPositionX = 0;
let pinchStartPositionY = 0;


function updateImage() {

    image.style.transform =
        `translate3d(${positionX}px, ${positionY}px, 0) scale(${scale})`;

}


function getImageDimensions() {

    return {

        width:
            image.offsetWidth * scale,

        height:
            image.offsetHeight * scale

    };

}


function constrainPosition() {

    const viewerWidth =
        imageViewer.clientWidth;

    const viewerHeight =
        imageViewer.clientHeight;

    const dimensions =
        getImageDimensions();


    const maxX =
        Math.max(
            0,
            (dimensions.width - viewerWidth) / 2
        );


    const maxY =
        Math.max(
            0,
            (dimensions.height - viewerHeight) / 2
        );


    positionX =
        Math.max(
            -maxX,
            Math.min(
                positionX,
                maxX
            )
        );


    positionY =
        Math.max(
            -maxY,
            Math.min(
                positionY,
                maxY
            )
        );

}


function calculateMinScale() {

    const viewerWidth =
        imageViewer.clientWidth;

    const viewerHeight =
        imageViewer.clientHeight;


    const imageWidth =
        image.naturalWidth;

    const imageHeight =
        image.naturalHeight;


    if (
        !imageWidth ||
        !imageHeight
    ) {

        minScale = 1;

        return;

    }


    minScale =
        Math.min(
            viewerWidth / imageWidth,
            viewerHeight / imageHeight
        );


    scale =
        Math.max(
            scale,
            minScale
        );

}


function fitImage() {

    const viewerWidth =
        imageViewer.clientWidth;

    const viewerHeight =
        imageViewer.clientHeight;


    const imageWidth =
        image.naturalWidth;

    const imageHeight =
        image.naturalHeight;


    if (
        !imageWidth ||
        !imageHeight
    ) {

        return;

    }


    minScale =
        Math.min(
            viewerWidth / imageWidth,
            viewerHeight / imageHeight
        );


    scale =
        minScale;


    positionX = 0;
    positionY = 0;


    updateImage();

}


function zoomAt(
    newScale,
    pointerX,
    pointerY
) {

    const oldScale =
        scale;


    newScale =
        Math.max(
            minScale,
            Math.min(
                newScale,
                maxScale
            )
        );


    if (
        newScale === oldScale
    ) {

        return;

    }


    const rect =
        imageViewer.getBoundingClientRect();


    const centerX =
        pointerX -
        rect.left -
        rect.width / 2;


    const centerY =
        pointerY -
        rect.top -
        rect.height / 2;


    const ratio =
        newScale / oldScale;


    positionX =
        centerX -
        (centerX - positionX) *
        ratio;


    positionY =
        centerY -
        (centerY - positionY) *
        ratio;


    scale =
        newScale;


    constrainPosition();

    updateImage();

}


function getDistance(
    pointer1,
    pointer2
) {

    const dx =
        pointer2.clientX -
        pointer1.clientX;

    const dy =
        pointer2.clientY -
        pointer1.clientY;


    return Math.sqrt(
        dx * dx +
        dy * dy
    );

}


function getCenter(
    pointer1,
    pointer2
) {

    return {

        x:
            (pointer1.clientX +
                pointer2.clientX) / 2,

        y:
            (pointer1.clientY +
                pointer2.clientY) / 2

    };

}


function startPinch() {

    const activePointers =
        Array.from(
            pointers.values()
        );


    if (
        activePointers.length !== 2
    ) {

        return;

    }


    const pointer1 =
        activePointers[0];

    const pointer2 =
        activePointers[1];


    pinchStartDistance =
        getDistance(
            pointer1,
            pointer2
        );


    pinchStartScale =
        scale;


    const center =
        getCenter(
            pointer1,
            pointer2
        );


    pinchStartCenterX =
        center.x;

    pinchStartCenterY =
        center.y;


    pinchStartPositionX =
        positionX;

    pinchStartPositionY =
        positionY;


    dragging = false;

}


imageViewer.addEventListener(
    "wheel",
    event => {

        event.preventDefault();


        const factor =
            event.deltaY < 0
                ? 1.1
                : 1 / 1.1;


        zoomAt(
            scale * factor,
            event.clientX,
            event.clientY
        );

    },
    {
        passive: false
    }
);


imageViewer.addEventListener(
    "pointerdown",
    event => {

        pointers.set(
            event.pointerId,
            {
                clientX:
                    event.clientX,

                clientY:
                    event.clientY
            }
        );


        imageViewer.setPointerCapture(
            event.pointerId
        );


        if (
            pointers.size === 2
        ) {

            startPinch();

            return;

        }


        if (
            scale <= minScale
        ) {

            return;

        }


        dragging = true;


        dragStartX =
            event.clientX -
            positionX;


        dragStartY =
            event.clientY -
            positionY;


        image.style.cursor =
            "grabbing";

    }
);


imageViewer.addEventListener(
    "pointermove",
    event => {

        if (
            !pointers.has(
                event.pointerId
            )
        ) {

            return;

        }


        pointers.set(
            event.pointerId,
            {
                clientX:
                    event.clientX,

                clientY:
                    event.clientY
            }
        );


        if (
            pointers.size === 2
        ) {

            const activePointers =
                Array.from(
                    pointers.values()
                );


            const pointer1 =
                activePointers[0];

            const pointer2 =
                activePointers[1];


            const distance =
                getDistance(
                    pointer1,
                    pointer2
                );


            const center =
                getCenter(
                    pointer1,
                    pointer2
                );


            if (
                pinchStartDistance <= 0
            ) {

                startPinch();

                return;

            }


            const distanceRatio =
                distance /
                pinchStartDistance;


            let newScale =
                pinchStartScale *
                distanceRatio;


            newScale =
                Math.max(
                    minScale,
                    Math.min(
                        newScale,
                        maxScale
                    )
                );


            const rect =
                imageViewer.getBoundingClientRect();


            const startCenterX =
                pinchStartCenterX -
                rect.left -
                rect.width / 2;


            const startCenterY =
                pinchStartCenterY -
                rect.top -
                rect.height / 2;


            const currentCenterX =
                center.x -
                rect.left -
                rect.width / 2;


            const currentCenterY =
                center.y -
                rect.top -
                rect.height / 2;


            const scaleRatio =
                newScale /
                pinchStartScale;


            positionX =
                currentCenterX -
                (
                    startCenterX -
                    pinchStartPositionX
                ) *
                scaleRatio;


            positionY =
                currentCenterY -
                (
                    startCenterY -
                    pinchStartPositionY
                ) *
                scaleRatio;


            scale =
                newScale;


            constrainPosition();

            updateImage();

            return;

        }


        if (
            !dragging
        ) {

            return;

        }


        positionX =
            event.clientX -
            dragStartX;


        positionY =
            event.clientY -
            dragStartY;


        constrainPosition();

        updateImage();

    }
);


function stopPointer(event) {

    pointers.delete(
        event.pointerId
    );


    if (
        pointers.size < 2
    ) {

        pinchStartDistance = 0;

    }


    if (
        pointers.size === 0
    ) {

        dragging = false;


        image.style.cursor =
            scale > minScale
                ? "grab"
                : "default";

    }


    if (
        imageViewer.hasPointerCapture(
            event.pointerId
        )
    ) {

        imageViewer.releasePointerCapture(
            event.pointerId
        );

    }

}


imageViewer.addEventListener(
    "pointerup",
    stopPointer
);


imageViewer.addEventListener(
    "pointercancel",
    stopPointer
);


imageViewer.addEventListener(
    "dblclick",
    () => {

        fitImage();

    }
);


window.addEventListener(
    "resize",
    () => {

        calculateMinScale();

        constrainPosition();

        updateImage();

    }
);


image.addEventListener(
    "load",
    () => {

        fitImage();

    }
);


if (
    image.complete
) {

    fitImage();

}