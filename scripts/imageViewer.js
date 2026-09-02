const imageViewer =
    document.getElementById("imageViewer");

const image =
    document.getElementById("floorPlan");


let scale = 1;
let minScale = 1;
let maxScale = 5;

let positionX = 0;
let positionY = 0;

let startX = 0;
let startY = 0;

let dragging = false;


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


    const viewerRect =
        imageViewer.getBoundingClientRect();


    const centerX =
        pointerX -
        viewerRect.left -
        viewerRect.width / 2;


    const centerY =
        pointerY -
        viewerRect.top -
        viewerRect.height / 2;


    const scaleRatio =
        newScale / oldScale;


    positionX =
        centerX -
        (centerX - positionX) *
        scaleRatio;


    positionY =
        centerY -
        (centerY - positionY) *
        scaleRatio;


    scale =
        newScale;


    constrainPosition();

    updateImage();

}


imageViewer.addEventListener(
    "wheel",
    event => {

        event.preventDefault();


        const zoomFactor =
            event.deltaY < 0
                ? 1.1
                : 1 / 1.1;


        zoomAt(
            scale * zoomFactor,
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

        if (
            scale <= minScale
        ) {
            return;
        }


        dragging = true;


        startX =
            event.clientX -
            positionX;


        startY =
            event.clientY -
            positionY;


        imageViewer.setPointerCapture(
            event.pointerId
        );


        image.style.cursor =
            "grabbing";

    }
);


imageViewer.addEventListener(
    "pointermove",
    event => {

        if (!dragging) {
            return;
        }


        positionX =
            event.clientX -
            startX;


        positionY =
            event.clientY -
            startY;


        constrainPosition();

        updateImage();

    }
);


function stopDragging(event) {

    if (!dragging) {
        return;
    }


    dragging = false;


    if (
        event?.pointerId !== undefined &&
        imageViewer.hasPointerCapture(
            event.pointerId
        )
    ) {

        imageViewer.releasePointerCapture(
            event.pointerId
        );

    }


    image.style.cursor =
        scale > minScale
            ? "grab"
            : "default";

}


imageViewer.addEventListener(
    "pointerup",
    stopDragging
);


imageViewer.addEventListener(
    "pointercancel",
    stopDragging
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


if (image.complete) {

    fitImage();

}