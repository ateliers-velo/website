console.log('tile-gallery JS loaded');

function displayDivOnHover(){
const div = document.querySelector('.tile-gallery');
    for (let i = 0; i < div.children.length; i += 1) {
        div.children[i].addEventListener('mouseover', function() {
            div.children[i].children[0].children[0].style.opacity = .8;
        });
        div.children[i].addEventListener('mouseout', function() {
            div.children[i].children[0].children[0].style.opacity = 0;
        });
    }
}
displayDivOnHover();

function zoomBackgroundOnHover() {
const div = document.querySelector('.tile-gallery');
    for (let i = 0; i < div.children.length; i += 1) {
        div.children[i].addEventListener('mouseover', function() {
            //div.children[i].children[0].style.backgroundSize = '120%';
            div.children[i].querySelector('div:first-child').style.transform = 'scale(1.025)';
            //div.children[i].children[0].style.zIndex = '1';
        });
        div.children[i].addEventListener('mouseout', function() {
            //div.children[i].children[0].style.backgroundSize = 'cover';
            div.children[i].querySelector('div:first-child').style.transform = 'scale(1.0)';
            //div.children[i].children[0].style.zIndex = '0';
        });
    }
}
zoomBackgroundOnHover();
//var container = document.querySelector('.container');
//var text = document.querySelector('#truncated-text');