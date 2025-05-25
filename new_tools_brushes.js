// js/new_tools_brushes.js

function pixelBrushDraw(ctx, x, y, brushSize, color, opacity, currentZoom) {
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;

    // Adjust brushSize for pixel grid based on zoom.
    // The idea is that 'brushSize' from the slider defines the size of one "pixel"
    // of the pixel brush.
    const pixelGridSize = Math.max(1, brushSize / currentZoom);

    // Snap to grid
    const snappedX = Math.floor(x / pixelGridSize) * pixelGridSize;
    const snappedY = Math.floor(y / pixelGridSize) * pixelGridSize;

    ctx.fillRect(snappedX, snappedY, pixelGridSize, pixelGridSize);
    // For continuous drawing, we might need to fill intermediate pixels if mouse moves too fast.
    // This simple version just draws at the current snapped position.
}

function applyGradient(ctx, startX, startY, endX, endY, primaryColor, secondaryColor, opacity, gradientType, canvasWidth, canvasHeight) {
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = opacity;

    let grad;
    if (gradientType === 'linear') {
        // For simplicity, gradient tool will fill the whole canvas for now.
        // More advanced: draw a line to define gradient direction and extent.
        // This example: a simple top-to-bottom or left-to-right based on drag direction
        let x0, y0, x1, y1;
        if (Math.abs(endX - startX) > Math.abs(endY - startY)) { // More horizontal drag
            x0 = 0; y0 = 0; x1 = canvasWidth; y1 = 0; // Left to right
            if (endX < startX) [primaryColor, secondaryColor] = [secondaryColor, primaryColor];
        } else { // More vertical drag
            x0 = 0; y0 = 0; x1 = 0; y1 = canvasHeight; // Top to bottom
             if (endY < startY) [primaryColor, secondaryColor] = [secondaryColor, primaryColor];
        }
        grad = ctx.createLinearGradient(x0, y0, x1, y1);

    } else if (gradientType === 'radial') {
        // Radial gradient logic would go here (needs center and radii)
        // For now, this is disabled in HTML.
        const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        grad = ctx.createRadialGradient(startX, startY, radius * 0.1, startX, startY, radius);
    } else {
        return; // Unknown type
    }

    grad.addColorStop(0, primaryColor);
    grad.addColorStop(1, secondaryColor);

    ctx.fillStyle = grad;
    // Fill the entire canvas (or a selection if implemented)
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
}

// You can also move fogPencilDraw here if you want
// function fogPencilDraw(ctx, x, y, brushSize, color, opacity, currentZoom, lastX, lastY) { ... }
