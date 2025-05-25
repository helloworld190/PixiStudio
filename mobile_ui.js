// js/mobile_ui.js
function initMobileUI() {
    const toggleToolbarBtn = document.getElementById('toggleToolbarBtn');
    const toggleOptionsBtn = document.getElementById('toggleOptionsBtn');
    const toolbar = document.getElementById('toolbar');
    const optionsPanel = document.getElementById('optionsPanel');
    const canvasArea = document.querySelector('.canvas-area'); // To detect clicks outside panels

    if (toggleToolbarBtn && toolbar) {
        toggleToolbarBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toolbar.classList.toggle('open');
            if (toolbar.classList.contains('open') && optionsPanel.classList.contains('open')) {
                optionsPanel.classList.remove('open'); // Close other panel if open
            }
        });
    }

    if (toggleOptionsBtn && optionsPanel) {
        toggleOptionsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            optionsPanel.classList.toggle('open');
             if (optionsPanel.classList.contains('open') && toolbar.classList.contains('open')) {
                toolbar.classList.remove('open'); // Close other panel if open
            }
        });
    }

    // Close panels if clicking on canvas area (optional, good for UX)
    if (canvasArea && toolbar && optionsPanel) {
        canvasArea.addEventListener('click', () => {
            if (window.innerWidth <= 768) { // Only on mobile view
                toolbar.classList.remove('open');
                optionsPanel.classList.remove('open');
            }
        });
         // Also handle touch events for closing panels
        canvasArea.addEventListener('touchstart', () => {
            if (window.innerWidth <= 768) {
                toolbar.classList.remove('open');
                optionsPanel.classList.remove('open');
            }
        }, { passive: true });
    }

    // Prevent page scroll on canvas touch on mobile
    const canvas = document.getElementById('drawingCanvas');
    if (canvas) {
        canvas.addEventListener('touchmove', function(event) {
            if (event.touches.length === 1) { // Allow pinch-zoom if more than one touch
                 event.preventDefault();
            }
        }, { passive: false });
    }
}
