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

let pinchStartDistance = 0;
let pinchStartScale = 1;

let pinchStartX = 0;
let pinchStartY = 0;


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


function getPointerDistance(
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


function getPointerCenter(
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


const activePointers =
    new Map();


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

        activePointers.set(
            event.pointerId,
            event
        );


        if (
            activePointers.size === 2
        ) {

            dragging = false;


            const pointers =
                Array.from(
                    activePointers.values()
                );


            pinchStartDistance =
                getPointerDistance(
                    pointers[0],
                    pointers[1]
                );


            pinchStartScale =
                scale;


            const center =
                getPointerCenter(
                    pointers[0],
                    pointers[1]
                );


            pinchStartX =
                center.x;

            pinchStartY =
                center.y;


            imageViewer.setPointerCapture(
                event.pointerId
            );


            return;

        }


        if (
            activePointers.size !== 1 ||
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

        if (
            activePointers.has(
                event.pointerId
            )
        ) {

            activePointers.set(
                event.pointerId,
                event
            );

        }


        if (
            activePointers.size === 2
        ) {

            const pointers =
                Array.from(
                    activePointers.values()
                );


            const distance =
                getPointerDistance(
                    pointers[0],
                    pointers[1]
                );


            if (
                !pinchStartDistance
            ) {

                return;

            }


            const scaleRatio =
                distance /
                pinchStartDistance;


            const newScale =
                Math.max(
                    minScale,
                    Math.min(
                        pinchStartScale *
                        scaleRatio,
                        maxScale
                    )
                );


            const center =
                getPointerCenter(
                    pointers[0],
                    pointers[1]
                );


            zoomAt(
                newScale,
                center.x,
                center.y
            );


            return;

        }


        if (
            !dragging
        ) {

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


function stopPointer(
    event
) {

    activePointers.delete(
        event.pointerId
    );


    if (
        activePointers.size < 2
    ) {

        pinchStartDistance = 0;

    }


    if (
        activePointers.size === 0
    ) {

        dragging = false;


        if (
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
    "pointerleave",
    event => {

        if (
            event.pointerType === "mouse"
        ) {

            stopPointer(event);

        }

    }
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