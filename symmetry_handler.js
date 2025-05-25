// js/symmetry_handler.js
let currentSymmetryMode = 'none'; // 'none', 'horizontal', 'vertical'
let symmetryCanvas = null; // Offscreen canvas for symmetry lines (optional)
let symmetryCtx = null;

function initSymmetry(mainCanvas) {
    // Optional: Create an overlay canvas for drawing symmetry lines
    // This is more for visual feedback than core drawing.
    // For now, we'll just handle the logic of drawing symmetric points.
}

function setSymmetryMode(mode, canvas, ctx, statusElement) {
    currentSymmetryMode = mode;
    if (statusElement) {
        statusElement.textContent = `Symmetry: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
    }
    // Highlight active symmetry option in menu
    document.querySelectorAll('#symmetryMenu a').forEach(a => {
        a.classList.toggle('active-symmetry', a.dataset.symmetry === mode);
    });

    // Clear previous symmetry lines if drawn on main canvas (not ideal)
    // A dedicated overlay or redrawing scene is better.
    // For simplicity, we'll rely on the drawing operation to cover old lines
    // or redraw the entire canvas if necessary (e.g., after zoom/pan).
    // If using an overlay canvas:
    // if (symmetryCtx) symmetryCtx.clearRect(0, 0, symmetryCanvas.width, symmetryCanvas.height);
    // drawSymmetryGuideLines(canvas, ctx); // Pass main canvas and context for now
}

function drawSymmetryGuideLines(canvas, ctx, currentZoom, panX, panY) {
    if (currentSymmetryMode === 'none' || !canvas || !ctx) return;

    // The guide lines should be drawn in screen space, not affected by content zoom/pan
    // Or, they are part of the content space. Let's assume content space for now.
    const originalLineWidth = ctx.lineWidth;
    const originalStrokeStyle = ctx.strokeStyle;
    const originalGlobalAlpha = ctx.globalAlpha;

    ctx.lineWidth = 1 / currentZoom; // Thin line, adjusted for zoom
    ctx.strokeStyle = 'rgba(150, 150, 255, 0.5)'; // Light blue, semi-transparent
    ctx.globalAlpha = 0.5;
    ctx.setLineDash([5 / currentZoom, 5 / currentZoom]); // Dashed line

    const canvasWidth = canvas.width / currentZoom;   // True canvas width in content space
    const canvasHeight = canvas.height / currentZoom; // True canvas height in content space

    ctx.beginPath();
    if (currentSymmetryMode === 'horizontal') {
        const midY = canvasHeight / 2;
        ctx.moveTo(0, midY);
        ctx.lineTo(canvasWidth, midY);
    } else if (currentSymmetryMode === 'vertical') {
        const midX = canvasWidth / 2;
        ctx.moveTo(midX, 0);
        ctx.lineTo(midX, canvasHeight);
    }
    ctx.stroke();

    ctx.setLineDash([]); // Reset line dash
    ctx.lineWidth = originalLineWidth;
    ctx.strokeStyle = originalStrokeStyle;
    ctx.globalAlpha = originalGlobalAlpha;
}


// Wrapper for drawing functions to include symmetric points
function drawWithSymmetry(x, y, canvas, ctx, drawFn, ...args) {
    // Original point
    drawFn(x, y, ...args); // Pass original x,y and other args to the actual drawing function

    if (currentSymmetryMode === 'none') return;

    const canvasWidth = canvas.width / currentZoom; // Assuming currentZoom is global or passed
    const canvasHeight = canvas.height / currentZoom;

    if (currentSymmetryMode === 'horizontal') {
        const symY = canvasHeight - y;
        drawFn(x, symY, ...args);
    } else if (currentSymmetryMode === 'vertical') {
        const symX = canvasWidth - x;
        drawFn(symX, y, ...args);
    }
    // Could add combined horizontal & vertical (like radial around center)
}
