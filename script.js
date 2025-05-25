// script.js
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('drawingCanvas');
    const ctx = canvas.getContext('2d');

    // --- UI Elements (Primary) ---
    const toolBtns = document.querySelectorAll('.tool-btn');
    const brushSizeSlider = document.getElementById('brushSize');
    const brushSizeValue = document.getElementById('brushSizeValue');
    const primaryColorPicker = document.getElementById('primaryColor');
    const secondaryColorPicker = document.getElementById('secondaryColor'); // For gradient
    const brushOpacitySlider = document.getElementById('brushOpacity');
    const brushOpacityValue = document.getElementById('brushOpacityValue');

    // New Tool Option UI
    const pencilHardnessSlider = document.getElementById('pencilHardness');
    const pencilHardnessValue = document.getElementById('pencilHardnessValue');
    const shapeFillCheckbox = document.getElementById('shapeFill');
    const shapeStrokeWidthSlider = document.getElementById('shapeStrokeWidth');
    const shapeStrokeWidthValue = document.getElementById('shapeStrokeWidthValue');
    const paintTypeSelect = document.getElementById('paintType'); // Existing
    const gradientTypeSelect = document.getElementById('gradientType');

    // Canvas Config UI
    const canvasWidthInput = document.getElementById('canvasWidth');
    const canvasHeightInput = document.getElementById('canvasHeight');
    const canvasBgColorInput = document.getElementById('canvasBgColor');
    const applyCanvasConfigBtn = document.getElementById('applyCanvasConfig');
    const resetCanvasConfigBtn = document.getElementById('resetCanvasConfig');

    // Menu & Action Buttons
    const clearCanvasBtn = document.getElementById('clearCanvas');
    const saveCanvasBtn = document.getElementById('saveCanvas');
    const loadCanvasBtn = document.getElementById('loadCanvas');
    const loadImageFileInput = document.getElementById('loadImageFile');
    const newCanvasBtn = document.getElementById('newCanvas');
    const undoBtn = document.getElementById('undo');
    const redoBtn = document.getElementById('redo');
    const toggleGridBtn = document.getElementById('toggleGrid');
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');
    const resetZoomBtn = document.getElementById('resetZoom');
    const symmetryOptions = document.querySelectorAll('.symmetry-option');


    // Status Bar UI
    const coordsStatus = document.getElementById('coords');
    const zoomLevelStatus = document.getElementById('zoomLevel');
    const currentToolStatus = document.getElementById('currentToolStatus');
    const symmetryStatusElement = document.getElementById('symmetryStatus'); // New

    // Dropdown menus (ensure these IDs match your HTML)
    const fileBtn = document.getElementById('btnFile');
    const fileMenu = document.getElementById('fileMenu');
    const editBtn = document.getElementById('btnEdit');
    const editMenu = document.getElementById('editMenu');
    const viewBtn = document.getElementById('btnView');
    const viewMenu = document.getElementById('viewMenu');
    const symmetryBtn = document.getElementById('btnSymmetry');
    const symmetryMenu = document.getElementById('symmetryMenu');


    // --- App State ---
    let isDrawing = false;
    let currentTool = 'pencil';
    let brushSize = 5;
    let primaryColor = '#FFFFFF';
    let secondaryColor = '#000000'; // For gradient
    let brushOpacity = 1;
    let pencilHardness = 1; // New
    let shapeShouldFill = false; // New
    let shapeStrokeWidth = 2; // New
    let currentGradientType = 'linear'; // New

    let lastX, lastY;
    let startX, startY; // For shapes/lines/gradient

    let history = [];
    let historyStep = -1;

    let currentZoom = 1; // Global currentZoom needed by symmetry_handler.js
    const MAX_ZOOM = 10; // Increased max zoom for pixel art
    const MIN_ZOOM = 0.1;
    const ZOOM_SENSITIVITY = 0.1;
    let panX = 0;
    let panY = 0;
    let isPanning = false;
    let lastPanX, lastPanY;

    let showGrid = false;
    const GRID_SIZE = 20;

    const DEFAULT_CANVAS_WIDTH = 800;
    const DEFAULT_CANVAS_HEIGHT = 600;
    const DEFAULT_CANVAS_BG = '#222222';


    // --- INITIALIZATION ---
    function initApp() {
        initMobileUI(); // From mobile_ui.js
        initToolOptionsManager(); // From tool_options_manager.js
        initSymmetry(canvas); // From symmetry_handler.js - pass canvas if needed for overlay

        canvasWidthInput.value = DEFAULT_CANVAS_WIDTH;
        canvasHeightInput.value = DEFAULT_CANVAS_HEIGHT;
        canvasBgColorInput.value = DEFAULT_CANVAS_BG;

        // Set initial values from sliders/pickers
        brushSize = parseInt(brushSizeSlider.value);
        primaryColor = primaryColorPicker.value;
        secondaryColor = secondaryColorPicker.value;
        brushOpacity = parseFloat(brushOpacitySlider.value);
        pencilHardness = parseFloat(pencilHardnessSlider.value);
        shapeShouldFill = shapeFillCheckbox.checked;
        shapeStrokeWidth = parseInt(shapeStrokeWidthSlider.value);
        currentGradientType = gradientTypeSelect.value;

        configureCanvas();
        setActiveTool('pencil'); // Set default tool
        updateStatus();

        // Initial call to set up options panel correctly
        updateToolSpecificOptionsUI(currentTool);
    }

    function configureCanvas() {
        const width = parseInt(canvasWidthInput.value);
        const height = parseInt(canvasHeightInput.value);
        const bgColor = canvasBgColorInput.value;

        canvas.width = width;
        canvas.height = height;
        
        ctx.setTransform(currentZoom, 0, 0, currentZoom, panX, panY);
        
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width / currentZoom, canvas.height / currentZoom);

        if (showGrid) drawGridFull(); // Use new drawGridFull for drawing after transform
        if (currentSymmetryMode !== 'none') drawSymmetryGuideLines(canvas, ctx, currentZoom, panX, panY);
        
        saveState();
        updateZoomStatus();
    }

    // --- DRAWING LOGIC ---
    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        let clientX = e.clientX;
        let clientY = e.clientY;

        // Handle touch events
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }
        
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: ((clientX - rect.left) * scaleX - panX) / currentZoom,
            y: ((clientY - rect.top) * scaleY - panY) / currentZoom
        };
    }

    function startDrawing(e) {
        // Prevent drawing if a dropdown is open (simple check)
        if (fileMenu.style.display === 'block' || editMenu.style.display === 'block' || viewMenu.style.display === 'block' || symmetryMenu.style.display === 'block') {
             closeAllDropdowns(); // Close it if user tries to draw
             return;
        }

        // Close mobile panels if open and drawing starts on canvas
        if (window.innerWidth <= 768) {
            document.getElementById('toolbar').classList.remove('open');
            document.getElementById('optionsPanel').classList.remove('open');
        }


        isDrawing = true;
        const pos = getMousePos(e);
        [lastX, lastY] = [pos.x, pos.y];
        [startX, startY] = [pos.x, pos.y];

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);

        if (['line', 'rectangle', 'circle', 'gradient'].includes(currentTool)) {
            saveState(false); // Temp state for preview
        }
        // For tools like pixelbrush, eyedropper, text, fill - action on mousedown/click
        if (currentTool === 'eyedropper') {
            eyedropperTool(e); // Eyedropper action on click
            isDrawing = false; // Don't continue to draw
            return;
        }
        if (currentTool === 'text') {
            textTool(e);
            isDrawing = false; return;
        }
        if (currentTool === 'fill') {
            fillTool(e);
            isDrawing = false; return;
        }
    }

    function draw(e) {
        if (!isDrawing) return;
        const pos = getMousePos(e);

        // Common context settings
        ctx.lineWidth = (currentTool === 'pixelbrush' ? 1 : brushSize) / currentZoom; // Pixel brush uses its own size logic
        ctx.strokeStyle = primaryColor;
        ctx.fillStyle = primaryColor;
        ctx.globalAlpha = brushOpacity;
        ctx.lineCap = (currentTool === 'pixelbrush' || currentTool === 'inkpencil') ? 'butt' : 'round';
        ctx.lineJoin = (currentTool === 'pixelbrush' || currentTool === 'inkpencil') ? 'miter' : 'round';

        // The actual drawing call, wrapped by symmetry if active
        const drawFnWrapper = (px, py) => {
            // Adjust lastX, lastY for symmetric strokes to ensure they connect properly if needed
            // This is complex. For now, each symmetric stroke starts from its own last symmetric point.
            // This might require passing lastSymmetricX, lastSymmetricY to draw functions.
            // Simplified: just draw point-to-point for symmetric strokes too.
            const currentLastX = (px === pos.x && py === pos.y) ? lastX : px; // A bit of a hack
            const currentLastY = (px === pos.x && py === pos.y) ? lastY : py;


            switch (currentTool) {
                case 'pencil':
                    pencilDraw(ctx, px, py, currentLastX, currentLastY, brushSize, primaryColor, brushOpacity, currentZoom, pencilHardness);
                    break;
                case 'inkpencil':
                    inkPencilDraw(ctx, px, py, currentLastX, currentLastY, brushSize, primaryColor, brushOpacity, currentZoom);
                    break;
                case 'paintbrush':
                    paintBrushDraw(ctx, px, py, currentLastX, currentLastY, brushSize, primaryColor, brushOpacity, currentZoom, paintTypeSelect.value);
                    break;
                case 'pixelbrush':
                    // For pixel brush, lastX/lastY are less relevant for individual pixel placement.
                    // The new_tools_brushes.pixelBrushDraw handles snapping.
                    pixelBrushDraw(ctx, px, py, brushSize, primaryColor, brushOpacity, currentZoom);
                    break;
                case 'eraser':
                    erase(ctx, px, py, currentLastX, currentLastY, brushSize, currentZoom);
                    break;
                case 'faderaser':
                    fadeErase(ctx, px, py, currentLastX, currentLastY, brushSize, brushOpacity, currentZoom);
                    break;
                case 'fogpencil':
                    fogPencilDraw(ctx, px, py, brushSize, primaryColor, brushOpacity, currentZoom); // No lastX/Y needed as it's point-based
                    break;
                case 'line':
                    previewLine(px, py); // Uses global startX, startY
                    break;
                case 'rectangle':
                    previewRectangle(px, py); // Uses global startX, startY
                    break;
                case 'circle':
                    previewCircle(px, py); // Uses global startX, startY
                    break;
                case 'gradient':
                    // Preview for gradient might be a line indicating direction
                    previewGradientLine(px, py);
                    break;
            }
        };

        if (currentSymmetryMode !== 'none' && !['line', 'rectangle', 'circle', 'gradient'].includes(currentTool)) {
            // For continuous drawing tools, apply symmetry
            drawWithSymmetry(pos.x, pos.y, canvas, ctx, drawFnWrapper);
        } else {
            // For shape previews or no symmetry, draw directly
            drawFnWrapper(pos.x, pos.y);
        }

        lastX = pos.x;
        lastY = pos.y;
    }

    function stopDrawing(e) {
        if (!isDrawing) return;
        isDrawing = false;
        ctx.closePath();

        const pos = getMousePos(e); // Get final position for shapes/gradient

        if (['line', 'rectangle', 'circle', 'gradient'].includes(currentTool)) {
            restoreState(historyStep); // Restore canvas to state before preview started

            // Re-apply context settings for final draw
            ctx.lineWidth = (currentTool === 'line' || ((currentTool === 'rectangle' || currentTool === 'circle') && !shapeShouldFill)) ? (shapeStrokeWidth / currentZoom) : (brushSize / currentZoom);
            ctx.strokeStyle = primaryColor;
            ctx.fillStyle = primaryColor;
            ctx.globalAlpha = brushOpacity;

            // Final draw with symmetry if active for shapes. Gradient is usually full canvas.
            const finalDrawFn = (finalX, finalY, sX, sY) => { // sX, sY are start points
                if (currentTool === 'line') {
                    ctx.beginPath(); ctx.moveTo(sX, sY); ctx.lineTo(finalX, finalY); ctx.stroke();
                } else if (currentTool === 'rectangle') {
                    ctx.beginPath();
                    ctx.rect(sX, sY, finalX - sX, finalY - sY);
                    if (shapeShouldFill) ctx.fill(); else ctx.stroke();
                } else if (currentTool === 'circle') {
                    const radius = Math.sqrt(Math.pow(finalX - sX, 2) + Math.pow(finalY - sY, 2));
                    ctx.beginPath(); ctx.arc(sX, sY, radius, 0, Math.PI * 2);
                    if (shapeShouldFill) ctx.fill(); else ctx.stroke();
                }
            };

            if (currentTool === 'gradient') {
                applyGradient(ctx, startX, startY, pos.x, pos.y, primaryColor, secondaryColor, brushOpacity, currentGradientType, canvas.width / currentZoom, canvas.height / currentZoom);
            } else if (currentSymmetryMode !== 'none' && (currentTool === 'rectangle' || currentTool === 'circle')) {
                // Symmetry for shapes: draw symmetric shapes based on the initial start point
                // This is complex because the symmetric start point also needs to be calculated.
                // Simplified: For now, symmetry on shapes will draw the shape at symmetric start points
                // based on the *center* of the canvas if it makes sense, or just the primary shape.
                // Let's just draw the primary shape for now, symmetry for shapes is harder.
                finalDrawFn(pos.x, pos.y, startX, startY);
            } else {
                 finalDrawFn(pos.x, pos.y, startX, startY);
            }
        }
        saveState();
    }


    // --- BRUSH IMPLEMENTATIONS (Modified to accept ctx and more params) ---
    function pencilDraw(context, x, y, prevX, prevY, size, color, opacity, zoom, hardness) {
        context.globalCompositeOperation = 'source-over';
        context.strokeStyle = color;
        context.globalAlpha = opacity;
        context.lineWidth = size / zoom;
        
        // Hardness: 0.1 (soft) to 1.0 (hard)
        // For soft, we could use a radial gradient or multiple offset strokes.
        // Simple approach for hardness: adjust lineCap or alpha based on hardness.
        // For now, let's make it simpler: harder pencils are just standard lines. Softer might reduce opacity slightly.
        // Or, true hardness affects edge feathering. For now, we'll assume hardness primarily means less smudging, sharper edge.
        // A more advanced pencil would use createLinearGradient for the stroke itself to simulate pressure/tilt.
        if (hardness < 0.5) { // Softer pencil
            context.lineCap = 'round';
            // Could add a slight blur or multiple semi-transparent strokes for true softness.
        } else {
            context.lineCap = 'butt'; // Harder edge
        }
        context.beginPath(); // Ensure each segment is distinct for hardness effect if varied
        context.moveTo(prevX, prevY);
        context.lineTo(x, y);
        context.stroke();
    }

    function inkPencilDraw(context, x, y, prevX, prevY, size, color, opacity, zoom) {
        context.globalCompositeOperation = 'source-over';
        context.strokeStyle = color;
        context.globalAlpha = opacity;
        context.lineWidth = Math.max(1, size / 2) / zoom; // Sharper
        context.lineCap = 'butt';
        context.lineJoin = 'miter';
        context.beginPath();
        context.moveTo(prevX, prevY);
        context.lineTo(x, y);
        context.stroke();
    }

    function paintBrushDraw(context, x, y, prevX, prevY, size, color, opacity, zoom, type) {
        context.globalCompositeOperation = 'source-over';
        context.strokeStyle = color;
        let currentBrushSize = size / zoom;
        context.lineWidth = currentBrushSize;
        context.lineCap = 'round';
        context.lineJoin = 'round';

        if (type === 'water') {
            context.globalAlpha = opacity * 0.3;
            for (let i = 0; i < 3; i++) {
                const offsetX = (Math.random() - 0.5) * currentBrushSize * 0.3;
                const offsetY = (Math.random() - 0.5) * currentBrushSize * 0.3;
                context.beginPath();
                context.moveTo(prevX + offsetX, prevY + offsetY);
                context.lineTo(x + offsetX, y + offsetY);
                context.stroke();
            }
        } else if (type === 'oil') {
            context.globalAlpha = opacity * 0.9;
            context.lineWidth = currentBrushSize * 1.2;
            context.beginPath();
            context.moveTo(prevX, prevY);
            context.lineTo(x, y);
            context.stroke();
        } else { // Stark
            context.globalAlpha = opacity;
            context.beginPath();
            context.moveTo(prevX, prevY);
            context.lineTo(x, y);
            context.stroke();
        }
    }

    function erase(context, x, y, prevX, prevY, size, zoom) {
        context.globalCompositeOperation = 'destination-out';
        context.lineWidth = size / zoom;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.beginPath();
        context.moveTo(prevX, prevY);
        context.lineTo(x, y);
        context.stroke();
    }

    function fadeErase(context, x, y, prevX, prevY, size, opacity, zoom) {
        context.globalCompositeOperation = 'destination-out';
        const originalAlpha = context.globalAlpha;
        context.globalAlpha = opacity * 0.2; // Erase with less power
        context.lineWidth = size / zoom;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.beginPath();
        context.moveTo(prevX, prevY);
        context.lineTo(x, y);
        context.stroke();
        context.globalAlpha = originalAlpha;
    }

    function fogPencilDraw(context, x, y, size, color, opacity, zoom) { // No prevX/Y
        context.globalCompositeOperation = 'source-over';
        const fogBrushSize = (size * 3) / zoom;
        const GA = context.globalAlpha;
        
        context.globalAlpha = opacity * 0.1;

        const gradient = context.createRadialGradient(x, y, fogBrushSize * 0.05, x, y, fogBrushSize * 0.5);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'transparent');

        context.fillStyle = gradient;
        context.beginPath();
        context.arc(x, y, fogBrushSize * 0.5, 0, Math.PI * 2);
        context.fill();
        
        context.globalAlpha = GA;
        context.moveTo(x, y); // Reset path
    }


    // --- SHAPE/GRADIENT PREVIEWS (use global startX, startY) ---
    function previewLine(x, y) {
        restoreState(historyStep + 1, true); // Restore to temp state or last perm
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(x, y);
        ctx.stroke();
    }
    function previewRectangle(x, y) {
        restoreState(historyStep + 1, true);
        ctx.beginPath();
        ctx.rect(startX, startY, x - startX, y - startY);
        if (shapeShouldFill) ctx.fill(); else ctx.stroke();
    }
    function previewCircle(x, y) {
        restoreState(historyStep + 1, true);
        const radius = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));
        ctx.beginPath();
        ctx.arc(startX, startY, radius, 0, Math.PI * 2);
        if (shapeShouldFill) ctx.fill(); else ctx.stroke();
    }
    function previewGradientLine(x,y) { // For gradient tool, show the line being dragged
        restoreState(historyStep + 1, true);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(x, y);
        const oldDash = ctx.getLineDash();
        ctx.setLineDash([5 / currentZoom, 5 / currentZoom]);
        ctx.strokeStyle = "rgba(200,200,200,0.7)"; // A light color for preview line
        ctx.lineWidth = 2 / currentZoom;
        ctx.stroke();
        ctx.setLineDash(oldDash);
    }


    // --- OTHER TOOLS ---
    function eyedropperTool(e) {
        const pos = getMousePos(e);
        const pixelData = ctx.getImageData(pos.x * currentZoom, pos.y * currentZoom, 1, 1).data;
        const color = `rgba(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]}, ${pixelData[3] / 255})`;
        
        primaryColorPicker.value = rgbToHex(pixelData[0], pixelData[1], pixelData[2]);
        primaryColor = primaryColorPicker.value;
        
        brushOpacitySlider.value = pixelData[3] / 255;
        brushOpacity = parseFloat(brushOpacitySlider.value);
        brushOpacityValue.textContent = brushOpacity.toFixed(2);

        // Optionally switch back to previous tool or pencil
        // setActiveTool('pencil'); // Or remember last tool
        updateCursor();
    }
    function rgbToHex(r, g, b) { /* ... as before ... */ return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase(); }

    function textTool(e) {
        const text = prompt("Enter text:", "Hello!");
        if (text) {
            const pos = getMousePos(e);
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = primaryColor;
            ctx.globalAlpha = brushOpacity;
            ctx.font = `${brushSize}px Arial`;
            // Apply symmetry to text if active (draw text at symmetric points)
            const drawTextFn = (tx, ty) => ctx.fillText(text, tx, ty);
            if (currentSymmetryMode !== 'none') {
                drawWithSymmetry(pos.x, pos.y, canvas, ctx, drawTextFn);
            } else {
                drawTextFn(pos.x, pos.y);
            }
            saveState();
        }
    }
    function fillTool(e) { /* ... as before using primaryColor ... */
        const pos = getMousePos(e);
        const startPixelX = Math.floor(pos.x);
        const startPixelY = Math.floor(pos.y);

        // Important: getImageData and putImageData operate on the underlying bitmap,
        // so coordinates should not be scaled by currentZoom here directly for these ops.
        // However, the fill logic needs to work in the "content space"
        const imageData = ctx.getImageData(0, 0, canvas.width / currentZoom, canvas.height / currentZoom);
        const data = imageData.data;
        const canvasContentWidth = canvas.width / currentZoom;

        const targetColor = getPixelColor(startPixelX, startPixelY, data, canvasContentWidth);
        const fillColor = hexToRgba(primaryColor, brushOpacity);

        if (colorsMatch(targetColor, fillColor)) return;

        const stack = [[startPixelX, startPixelY]];
        const visited = new Set(); // To prevent re-processing pixels in complex shapes

        while (stack.length) {
            const [x, y] = stack.pop();
            const pixelKey = `${x},${y}`;

            if (x < 0 || x >= canvasContentWidth || y < 0 || y >= canvas.height / currentZoom || visited.has(pixelKey)) {
                continue;
            }
            visited.add(pixelKey);

            const currentColor = getPixelColor(x, y, data, canvasContentWidth);
            if (colorsMatch(currentColor, targetColor)) {
                setPixelColor(x, y, fillColor, data, canvasContentWidth);
                stack.push([x + 1, y]);
                stack.push([x - 1, y]);
                stack.push([x, y + 1]);
                stack.push([x, y - 1]);
            }
        }
        ctx.putImageData(imageData, 0, 0);
        saveState();
    }
    function getPixelColor(x, y, data, width) { /* ... as before ... */ const index = (Math.floor(y) * Math.floor(width) + Math.floor(x)) * 4; return [data[index], data[index+1], data[index+2], data[index+3]]; }
    function setPixelColor(x, y, color, data, width) { /* ... as before ... */ const index = (Math.floor(y) * Math.floor(width) + Math.floor(x)) * 4; data[index]=color[0]; data[index+1]=color[1]; data[index+2]=color[2]; data[index+3]=color[3]; }
    function colorsMatch(c1, c2) { /* ... as before ... */ return c1 && c2 && c1[0]===c2[0] && c1[1]===c2[1] && c1[2]===c2[2] && c1[3]===c2[3];}
    function hexToRgba(hex, alpha = 1) { /* ... as before ... */ const r=parseInt(hex.slice(1,3),16); const g=parseInt(hex.slice(3,5),16); const b=parseInt(hex.slice(5,7),16); return [r,g,b,Math.floor(alpha*255)];}

    // --- UI & TOOL MANAGEMENT ---
    function setActiveTool(tool) {
        currentTool = tool;
        toolBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });
        updateToolSpecificOptionsUI(tool); // From tool_options_manager.js
        updateCursor();
        updateStatus();
    }
    function updateCursor() { /* ... as before ... */
        if (currentTool === 'eyedropper') {
            canvas.classList.add('eyedropper-cursor');
        } else {
            canvas.classList.remove('eyedropper-cursor');
            if (currentTool === 'text') canvas.style.cursor = 'text';
            else if (isPanning) canvas.style.cursor = 'grabbing';
            else if (currentTool === 'fill' || currentTool === 'gradient') canvas.style.cursor = 'copy';
            else canvas.style.cursor = 'crosshair';
        }
    }
    function updateStatus() { /* ... as before ... */ currentToolStatus.textContent = `Tool: ${currentTool.charAt(0).toUpperCase() + currentTool.slice(1)}`; }

    // --- CANVAS CONFIGURATION ---
    applyCanvasConfigBtn.addEventListener('click', () => {
        if (confirm("Applying new canvas configuration will clear the current drawing. Continue?")) {
            history = []; historyStep = -1;
            currentZoom = 1; panX = 0; panY = 0;
            configureCanvas();
        } else {
            canvasWidthInput.value = canvas.width;
            canvasHeightInput.value = canvas.height;
        }
    });
    resetCanvasConfigBtn.addEventListener('click', () => { /* ... as before ... */
        canvasWidthInput.value = DEFAULT_CANVAS_WIDTH;
        canvasHeightInput.value = DEFAULT_CANVAS_HEIGHT;
        canvasBgColorInput.value = DEFAULT_CANVAS_BG;
        if (confirm("Resetting to default will clear current drawing. Continue?")) {
            history = []; historyStep = -1;
            currentZoom = 1; panX = 0; panY = 0;
            configureCanvas();
        }
    });


    // --- HISTORY (UNDO/REDO) ---
    function saveState(addToHistory = true) { /* ... as before ... */
         if (!addToHistory) {
            if (history.length > historyStep + 1) {
                 history[historyStep + 1] = ctx.getImageData(0, 0, canvas.width, canvas.height);
            } else {
                 history.splice(historyStep + 1, 0, ctx.getImageData(0, 0, canvas.width, canvas.height));
            }
            return;
        }
        if (historyStep < history.length - 1) {
            history = history.slice(0, historyStep + 1);
        }
        history.push(ctx.getImageData(0, 0, canvas.width, canvas.height)); // Save full canvas state
        historyStep++;
        if (history.length > 30) { // Increased history limit
            history.shift();
            historyStep--;
        }
    }
    function restoreState(step, isTemporary = false) { /* ... modified to call drawGridFull and symmetry lines ... */
        if (step < 0 || step >= history.length) return;
        
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear with identity
        ctx.restore(); // Restore current drawing transform

        // The history stores ImageData at 1:1 pixel ratio of the canvas HTML element size.
        // It does not store it in "content space" (divided by zoom).
        // So, when we putImageData, it should map directly to the canvas element pixels.
        // The transform is for drawing operations, not putImageData.
        // However, if we want history to respect zoom (which is more complex),
        // we'd need to draw the ImageData onto a temp canvas and then drawImage that temp canvas scaled.
        // For now, let's assume history IS affected by current zoom if we putImage directly.
        // A better way:
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = history[step].width;
        tempCanvas.height = history[step].height;
        tempCanvas.getContext('2d').putImageData(history[step], 0, 0);

        // Clear current canvas before drawing scaled history image
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
        ctx.fillStyle = canvasBgColorInput.value; // Use current BG
        ctx.fillRect(0,0,canvas.width, canvas.height);
        ctx.restore(); // Back to drawing transform

        // Draw the restored image, respecting current pan/zoom for how it's viewed
        ctx.drawImage(tempCanvas, 0, 0);


        if (!isTemporary) {
            historyStep = step;
        }
        
        // Re-apply visual guides after content is restored
        if (showGrid) drawGridFull();
        if (currentSymmetryMode !== 'none') drawSymmetryGuideLines(canvas, ctx, currentZoom, panX, panY);
    }
    undoBtn.addEventListener('click', () => { if (historyStep > 0) { historyStep--; restoreState(historyStep); } });
    redoBtn.addEventListener('click', () => { if (historyStep < history.length - 1) { historyStep++; restoreState(historyStep); } });
    document.addEventListener('keydown', (e) => { /* ... as before ... */ if(e.ctrlKey||e.metaKey){if(e.key==='z'){e.preventDefault();undoBtn.click();}else if(e.key==='y'){e.preventDefault();redoBtn.click();}}});


    // --- ZOOM & PAN ---
    function applyZoomPan() {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
        ctx.fillStyle = canvasBgColorInput.value; // Use current BG
        ctx.fillRect(0,0,canvas.width, canvas.height);
        ctx.restore(); // Back to drawing transform

        ctx.setTransform(currentZoom, 0, 0, currentZoom, panX, panY);
        
        if (history.length > 0 && history[historyStep]) {
            // Draw the current state from history (which is full canvas pixels)
            // It will be drawn scaled/panned by the current transform.
             const tempCanvas = document.createElement('canvas');
             tempCanvas.width = history[historyStep].width;
             tempCanvas.height = history[historyStep].height;
             tempCanvas.getContext('2d').putImageData(history[historyStep], 0, 0);
             ctx.drawImage(tempCanvas, 0, 0);
        } else {
            // This case should ideally not happen if initCanvas saves a state
            // But as a fallback, fill with BG color (already done above)
        }

        if (showGrid) drawGridFull();
        if (currentSymmetryMode !== 'none') drawSymmetryGuideLines(canvas, ctx, currentZoom, panX, panY);
        updateZoomStatus();
    }
    function updateZoomStatus() { /* ... as before ... */ zoomLevelStatus.textContent = `Zoom: ${Math.round(currentZoom * 100)}%`; }
    
    canvas.addEventListener('wheel', (e) => { /* ... as before, but call applyZoomPan ... */
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        // Mouse position in world space (before this zoom event)
        const mouseX = (e.clientX - rect.left - panX) / currentZoom;
        const mouseY = (e.clientY - rect.top - panY) / currentZoom;

        const zoomFactor = e.deltaY < 0 ? (1 + ZOOM_SENSITIVITY) : (1 - ZOOM_SENSITIVITY);
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom * zoomFactor));

        if (newZoom === currentZoom) return; // No change

        currentZoom = newZoom;
        // Adjust pan so the content under the mouse stays in the same place
        panX = (e.clientX - rect.left) - mouseX * currentZoom;
        panY = (e.clientY - rect.top) - mouseY * currentZoom;
        
        applyZoomPan();
    });
    zoomInBtn.addEventListener('click', () => { /* ... as before, call applyZoomPan ... */ if(currentZoom*(1+ZOOM_SENSITIVITY)<=MAX_ZOOM){currentZoom*=(1+ZOOM_SENSITIVITY);applyZoomPan();}});
    zoomOutBtn.addEventListener('click', () => { /* ... as before, call applyZoomPan ... */ if(currentZoom*(1-ZOOM_SENSITIVITY)>=MIN_ZOOM){currentZoom*=(1-ZOOM_SENSITIVITY);applyZoomPan();}});
    resetZoomBtn.addEventListener('click', () => { /* ... as before, call applyZoomPan ... */ currentZoom=1;panX=0;panY=0;applyZoomPan();});

    // Panning Listeners
    function handlePanStart(e) {
        let clientX = e.clientX;
        let clientY = e.clientY;
        if (e.touches) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }

        isPanning = true;
        lastPanX = clientX;
        lastPanY = clientY;
        canvas.style.cursor = 'grabbing';
        e.preventDefault();
    }
    function handlePanMove(e) {
        if (!isPanning) return;
        let clientX = e.clientX;
        let clientY = e.clientY;
        if (e.touches) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }

        const dx = clientX - lastPanX;
        const dy = clientY - lastPanY;
        panX += dx;
        panY += dy;
        lastPanX = clientX;
        lastPanY = clientY;
        applyZoomPan();
    }
    function handlePanEnd(e) {
        if (isPanning) {
            isPanning = false;
            updateCursor();
        }
    }

    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle mouse or Alt + Left Click
            handlePanStart(e);
        } else if (e.button === 0) {
            startDrawing(e);
        }
    });
    canvas.addEventListener('mousemove', (e) => {
        if (isPanning) {
            handlePanMove(e);
        } else {
            draw(e);
        }
        const pos = getMousePos(e);
        coordsStatus.textContent = `X: ${Math.round(pos.x)}, Y: ${Math.round(pos.y)}`;
    });
    canvas.addEventListener('mouseup', (e) => {
        if (isPanning) {
            handlePanEnd(e);
        } else if (e.button === 0) {
            stopDrawing(e);
        }
    });
    canvas.addEventListener('mouseleave', () => {
        if (isPanning) handlePanEnd();
        // if (isDrawing) stopDrawing(); // Optional
        coordsStatus.textContent = `X: --, Y: --`;
    });

    // Touch events for drawing and panning (basic support)
    let twoFingerPan = false;
    let initialPinchDistance = null;

    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) { // Two fingers for panning or pinch-zoom
            twoFingerPan = true;
            handlePanStart(e.touches[0]); // Use first touch for pan reference
            
            // Pinch zoom setup
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
            e.preventDefault(); // Prevent default two-finger gestures
        } else if (e.touches.length === 1) {
            twoFingerPan = false;
            initialPinchDistance = null;
            startDrawing(e); // e already has touches[0]
        }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        if (twoFingerPan && e.touches.length === 2) {
            // Panning with two fingers
            const currentPanX = e.touches[0].clientX;
            const currentPanY = e.touches[0].clientY;
            const deltaPanX = currentPanX - lastPanX; // lastPanX/Y set by handlePanStart
            const deltaPanY = currentPanY - lastPanY;
            panX += deltaPanX;
            panY += deltaPanY;
            lastPanX = currentPanX;
            lastPanY = currentPanY;

            // Pinch zoom
            if (initialPinchDistance) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const currentPinchDistance = Math.sqrt(dx * dx + dy * dy);
                const zoomFactor = currentPinchDistance / initialPinchDistance;
                
                const rect = canvas.getBoundingClientRect();
                const midPointX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                const midPointY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

                // Mouse position in world space (before this zoom event)
                const worldMidX = (midPointX - rect.left - panX) / currentZoom;
                const worldMidY = (midPointY - rect.top - panY) / currentZoom;
                
                const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom * zoomFactor));

                if (newZoom !== currentZoom) {
                    currentZoom = newZoom;
                    // Adjust pan so the content under the pinch center stays
                    panX = (midPointX - rect.left) - worldMidX * currentZoom;
                    panY = (midPointY - rect.top) - worldMidY * currentZoom;
                }
                initialPinchDistance = currentPinchDistance; // Update for next move
            }
            applyZoomPan();
            e.preventDefault();

        } else if (!twoFingerPan && e.touches.length === 1) {
            draw(e); // e has touches[0]
            const pos = getMousePos(e);
            coordsStatus.textContent = `X: ${Math.round(pos.x)}, Y: ${Math.round(pos.y)}`;
        }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
        if (twoFingerPan) {
             if (e.touches.length < 2) { // Went from 2 to 1 or 0 fingers
                twoFingerPan = false;
                initialPinchDistance = null;
                if (isPanning) handlePanEnd(e);
            }
        } else {
             if (e.touches.length === 0) { // Last finger lifted
                stopDrawing(e); // e might not have changedTouches correctly, use last known if needed
            }
        }
    });


    // Allow panning with Space + Drag (modified for Alt key for now)
    document.addEventListener('keydown', (e) => { if (e.altKey && !isDrawing && !isPanning) { canvas.style.cursor = 'grab'; e.target.altKeyActive = true;} });
    document.addEventListener('keyup', (e) => { if (e.key === 'Alt') { if (!isPanning) updateCursor(); e.target.altKeyActive = false;} });


    // --- GRID (Modified to draw grid over content, respecting transform) ---
    function drawGridFull() { // Renamed from drawGrid
        if (!showGrid) return;
        ctx.save(); // Save current drawing state (transform, styles)
        
        // Grid lines should appear fixed relative to the content.
        // So, they are drawn in the transformed space.
        ctx.strokeStyle = 'rgba(204, 204, 204, 0.15)';
        ctx.lineWidth = 0.5 / currentZoom; // Grid lines should be thin regardless of zoom

        const canvasTrueWidth = canvas.width / currentZoom;
        const canvasTrueHeight = canvas.height / currentZoom;
        
        // Calculate the visible portion of the grid due to panning
        // Top-left corner of the visible canvas area in content coordinates
        const startXVisible = -panX / currentZoom;
        const startYVisible = -panY / currentZoom;
        // Bottom-right corner
        const endXVisible = (canvas.width - panX) / currentZoom;
        const endYVisible = (canvas.height - panY) / currentZoom;

        // Draw vertical lines
        for (let x = Math.floor(startXVisible / GRID_SIZE) * GRID_SIZE; x <= endXVisible; x += GRID_SIZE) {
            ctx.beginPath();
            ctx.moveTo(x, startYVisible);
            ctx.lineTo(x, endYVisible);
            ctx.stroke();
        }
        // Draw horizontal lines
        for (let y = Math.floor(startYVisible / GRID_SIZE) * GRID_SIZE; y <= endYVisible; y += GRID_SIZE) {
            ctx.beginPath();
            ctx.moveTo(startXVisible, y);
            ctx.lineTo(endXVisible, y);
            ctx.stroke();
        }
        ctx.restore(); // Restore drawing state
    }
    toggleGridBtn.addEventListener('click', () => {
        showGrid = !showGrid;
        applyZoomPan(); // Redraw canvas to show/hide grid
        toggleGridBtn.style.backgroundColor = showGrid ? 'var(--accent-color)' : '';
    });

    // --- SYMMETRY ---
    symmetryOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            const mode = e.target.dataset.symmetry;
            setSymmetryMode(mode, canvas, ctx, symmetryStatusElement); // From symmetry_handler.js
            closeAllDropdowns();
            applyZoomPan(); // Redraw to show/hide symmetry lines
        });
    });


    // --- FILE OPERATIONS ---
    newCanvasBtn.addEventListener('click', () => { /* ... as before, calls configureCanvas ... */ if(confirm("Create new? Unsaved lost.")){history=[];historyStep=-1;currentZoom=1;panX=0;panY=0;configureCanvas();}});
    clearCanvasBtn.addEventListener('click', () => { /* ... as before, calls configureCanvas then saveState ... */ if(confirm("Clear canvas?")){configureCanvas();saveState();}});
    saveCanvasBtn.addEventListener('click', () => { /* ... as before ... */
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        const originalWidth = canvas.width / currentZoom; // Target unzoomed width
        const originalHeight = canvas.height / currentZoom; // Target unzoomed height
        tempCanvas.width = originalWidth;
        tempCanvas.height = originalHeight;

        // Draw background color on temp canvas
        tempCtx.fillStyle = canvasBgColorInput.value;
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        if (history.length > 0 && history[historyStep]) {
            // history[historyStep] is ImageData for the full canvas element size.
            // We need to draw it onto the tempCanvas.
            // If canvas element size matches originalWidth/Height, it's direct.
            // If not (e.g. if canvas element was resized without content scaling), this needs care.
            // Assuming canvas.width/height match the desired output after zoom=1.
             const sourceImageData = history[historyStep];
             if (sourceImageData.width === tempCanvas.width && sourceImageData.height === tempCanvas.height) {
                tempCtx.putImageData(sourceImageData, 0, 0);
             } else {
                // If history ImageData dimensions don't match target, need to scale draw
                // This usually means the canvas HTML element size changed.
                // For robust saving, history should store unzoomed content or save needs to rescale.
                // Simple case: Assume history[historyStep] is at the canvas.width/height scale.
                const historyCanvas = document.createElement('canvas');
                historyCanvas.width = sourceImageData.width;
                historyCanvas.height = sourceImageData.height;
                historyCanvas.getContext('2d').putImageData(sourceImageData,0,0);
                tempCtx.drawImage(historyCanvas, 0,0, tempCanvas.width, tempCanvas.height);
             }
        }

        const dataURL = tempCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'drawing_enhanced.png';
        link.href = dataURL;
        link.click();
    });
    loadCanvasBtn.addEventListener('click', () => loadImageFileInput.click());
    loadImageFileInput.addEventListener('change', (e) => { /* ... as before, calls configureCanvas and saveState ... */
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    canvasWidthInput.value = img.width;
                    canvasHeightInput.value = img.height;
                    currentZoom = 1; panX = 0; panY = 0; // Reset view for new image
                    configureCanvas(); // Sets new size, draws BG, saves initial state
                    
                    // Now draw the loaded image on top of the BG
                    ctx.setTransform(currentZoom, 0, 0, currentZoom, panX, panY); // Re-apply transform for drawing image
                    ctx.drawImage(img, 0, 0);
                    saveState(); // Save this loaded image as the next state
                }
                img.src = event.target.result;
            }
            reader.readAsDataURL(file);
            loadImageFileInput.value = '';
        }
    });


    // --- EVENT LISTENERS FOR CONTROLS ---
    toolBtns.forEach(btn => { btn.addEventListener('click', () => setActiveTool(btn.dataset.tool)); });
    brushSizeSlider.addEventListener('input', (e) => { brushSize = parseInt(e.target.value); brushSizeValue.textContent = brushSize; });
    primaryColorPicker.addEventListener('input', (e) => { primaryColor = e.target.value; });
    secondaryColorPicker.addEventListener('input', (e) => { secondaryColor = e.target.value; });
    brushOpacitySlider.addEventListener('input', (e) => { brushOpacity = parseFloat(e.target.value); brushOpacityValue.textContent = brushOpacity.toFixed(2); });

    // New Option Listeners
    if(pencilHardnessSlider) pencilHardnessSlider.addEventListener('input', (e) => { pencilHardness = parseFloat(e.target.value); pencilHardnessValue.textContent = pencilHardness.toFixed(2); });
    if(shapeFillCheckbox) shapeFillCheckbox.addEventListener('change', (e) => {
        shapeShouldFill = e.target.checked;
        // updateToolSpecificOptionsUI(currentTool); // To show/hide stroke width - handled in tool_options_manager
    });
    if(shapeStrokeWidthSlider) shapeStrokeWidthSlider.addEventListener('input', (e) => { shapeStrokeWidth = parseInt(e.target.value); shapeStrokeWidthValue.textContent = shapeStrokeWidth; });
    if(gradientTypeSelect) gradientTypeSelect.addEventListener('change', (e) => { currentGradientType = e.target.value; });
    if(paintTypeSelect) paintTypeSelect.addEventListener('change', (e) => { /* state updated directly by brush */ });


    // Dropdown Menu Logic
    function toggleDropdown(menuElement, buttonElement) { /* ... as before ... */
        const isVisible = menuElement.style.display === 'block';
        closeAllDropdowns();
        if (!isVisible) {
            menuElement.style.display = 'block';
            // Position dropdown:
            const btnRect = buttonElement.getBoundingClientRect();
            menuElement.style.top = btnRect.bottom + 'px';
            menuElement.style.left = btnRect.left + 'px';
        }
    }
    function closeAllDropdowns() { /* ... as before ... */ document.querySelectorAll('.dropdown-content').forEach(menu => menu.style.display = 'none');}
    if(fileBtn) fileBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleDropdown(fileMenu, fileBtn); });
    if(editBtn) editBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleDropdown(editMenu, editBtn); });
    if(viewBtn) viewBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleDropdown(viewMenu, viewBtn); });
    if(symmetryBtn) symmetryBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleDropdown(symmetryMenu, symmetryBtn); });
    window.addEventListener('click', (e) => { if (!e.target.matches('.menu-button, .menu-button i')) { closeAllDropdowns(); } });


    // --- START ---
    initApp();

}); // End DOMContentLoaded
