const imageViewer = document.getElementById("imageViewer");
const image = document.getElementById("floorPlan");

let scale = 1;
let minScale = 1;

let positionX = 0;
let positionY = 0;

let startX = 0;
let startY = 0;

let dragging = false;

function updateImage() {
    image.style.transform =
        `translate(${positionX}px, ${positionY}px) scale(${scale})`;
}

function constrainPosition() {

    const viewerWidth = imageViewer.clientWidth;
    const viewerHeight = imageViewer.clientHeight;

    const imageWidth = image.offsetWidth * scale;
    const imageHeight = image.offsetHeight * scale;

    const maxX = Math.max(0, (imageWidth - viewerWidth) / 2);
    const maxY = Math.max(0, (imageHeight - viewerHeight) / 2);

    positionX = Math.max(-maxX, Math.min(positionX, maxX));
    positionY = Math.max(-maxY, Math.min(positionY, maxY));
}

function fitImage() {

    scale = 1;

    positionX = 0;
    positionY = 0;

    updateImage();
}

imageViewer.addEventListener("wheel", (event) => {

    event.preventDefault();

    if (event.deltaY < 0) {
        scale *= 1.1;
    } else {
        scale /= 1.1;
    }

    scale = Math.max(minScale, Math.min(scale, 5));

    constrainPosition();

    updateImage();
});

imageViewer.addEventListener("pointerdown", (event) => {

    if (scale <= minScale) {
        return;
    }

    dragging = true;

    startX = event.clientX - positionX;
    startY = event.clientY - positionY;

    imageViewer.setPointerCapture(event.pointerId);

    image.style.cursor = "grabbing";
});

imageViewer.addEventListener("pointermove", (event) => {

    if (!dragging) {
        return;
    }

    positionX = event.clientX - startX;
    positionY = event.clientY - startY;

    constrainPosition();

    updateImage();
});

imageViewer.addEventListener("pointerup", (event) => {

    dragging = false;

    imageViewer.releasePointerCapture(event.pointerId);

    image.style.cursor = "grab";
});

imageViewer.addEventListener("pointercancel", () => {

    dragging = false;

    image.style.cursor = "grab";
});

imageViewer.addEventListener("dblclick", () => {

    fitImage();

});

window.addEventListener("resize", () => {

    fitImage();

});

image.addEventListener("load", () => {

    fitImage();

});