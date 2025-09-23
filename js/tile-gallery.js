console.log('tile-gallery JS loaded');

// Remove opacity changes for h1/p, but keep zoom and darken effect on hover
function zoomAndDarkenOnHover() {
    const div = document.querySelector('.tile-gallery');
    for (let i = 0; i < div.children.length; i += 1) {
        const tile = div.children[i];
        const bgDiv = tile.querySelector('div:first-child');

        tile.addEventListener('mouseover', function() {
            // Zoom effect
            bgDiv.style.transform = 'scale(1.025)';
            // Darken effect
            bgDiv.style.filter = 'brightness(0.7)';
        });

        tile.addEventListener('mouseout', function() {
            // Reset zoom
            bgDiv.style.transform = 'scale(1.0)';
            // Reset darken
            bgDiv.style.filter = 'brightness(1)';
        });
    }
}
zoomAndDarkenOnHover();