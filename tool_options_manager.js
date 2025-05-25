// js/tool_options_manager.js
const toolSpecificOptionElements = {}; // Will be populated in script.js
let currentToolForOptions = '';

function initToolOptionsManager() {
    // References to tool-specific option divs
    toolSpecificOptionElements.pencil = document.getElementById('pencilOptions');
    toolSpecificOptionElements.paintbrush = document.getElementById('paintbrushOptions');
    toolSpecificOptionElements.pixelbrush = document.getElementById('pixelBrushOptions');
    toolSpecificOptionElements.shape = document.getElementById('shapeOptions'); // For line, rect, circle
    toolSpecificOptionElements.gradient = document.getElementById('gradientOptions');

    // General option elements that change visibility/relevance
    toolSpecificOptionElements.secondaryColor = document.getElementById('secondaryColorOption');
    toolSpecificOptionElements.shapeStroke = document.getElementById('shapeStrokeOption');

    // Add event listeners for new options if they are not handled in main script.js
    // For example, shapeFill checkbox affecting shapeStrokeOption visibility
    const shapeFillCheckbox = document.getElementById('shapeFill');
    if (shapeFillCheckbox && toolSpecificOptionElements.shapeStroke) {
        shapeFillCheckbox.addEventListener('change', (e) => {
            toolSpecificOptionElements.shapeStroke.style.display = e.target.checked ? 'none' : 'block';
        });
    }
}

function updateToolSpecificOptionsUI(toolName) {
    currentToolForOptions = toolName;

    // Hide all tool-specific option groups first
    for (const key in toolSpecificOptionElements) {
        if (toolSpecificOptionElements[key] && toolSpecificOptionElements[key].classList && toolSpecificOptionElements[key].classList.contains('tool-specific-options')) {
            toolSpecificOptionElements[key].style.display = 'none';
        }
    }

    // Hide general options that are tool-dependent by default
    if (toolSpecificOptionElements.secondaryColor) toolSpecificOptionElements.secondaryColor.style.display = 'none';
    if (toolSpecificOptionElements.shapeStroke) toolSpecificOptionElements.shapeStroke.style.display = 'block'; // Default for shapes


    // Show options for the current tool
    if (toolName === 'pencil' && toolSpecificOptionElements.pencil) {
        toolSpecificOptionElements.pencil.style.display = 'block';
    } else if (toolName === 'paintbrush' && toolSpecificOptionElements.paintbrush) {
        toolSpecificOptionElements.paintbrush.style.display = 'block';
    } else if (toolName === 'pixelbrush' && toolSpecificOptionElements.pixelbrush) {
        toolSpecificOptionElements.pixelbrush.style.display = 'block';
    } else if (['line', 'rectangle', 'circle'].includes(toolName) && toolSpecificOptionElements.shape) {
        toolSpecificOptionElements.shape.style.display = 'block';
        const shapeFillCheckbox = document.getElementById('shapeFill');
        if (shapeFillCheckbox && toolSpecificOptionElements.shapeStroke) { // ensure elements exist
            toolSpecificOptionElements.shapeStroke.style.display = shapeFillCheckbox.checked ? 'none' : 'block';
        }
    } else if (toolName === 'gradient' && toolSpecificOptionElements.gradient) {
        toolSpecificOptionElements.gradient.style.display = 'block';
        if (toolSpecificOptionElements.secondaryColor) toolSpecificOptionElements.secondaryColor.style.display = 'block';
    }
}
