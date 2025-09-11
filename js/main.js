console.log('JS loaded');

document.addEventListener('DOMContentLoaded', function() {
    
    console.log('DOM loaded');
    // TEMPORARY FIX ONLY FOR GH PAGES
    const prefix = "/website"
    /*
    const light = document.getElementById('light-toggle');
    const navWrapper = document.querySelector('.nav-items');

    light.addEventListener('click', function () {
        const themeStyle = document.getElementById('theme-style');
        const currentTheme = themeStyle.getAttribute('href');
        
        if (currentTheme === '/css/dark-mode.css') {
            themeStyle.setAttribute('href', prefix + '/css/light-mode.css');
        } else {
            themeStyle.setAttribute('href', prefix + '/css/dark-mode.css');
        }
        navWrapper.classList.toggle('activated');
    });
    */

    /*
    const open = document.getElementById('open');
    const close = document.getElementById('close');
    const navitems = document.querySelectorAll('.nav-item');

    open.addEventListener('click', function() {
        navitems.forEach((navitem) => {
            navitem.style.display = '';
            navitem.style.opacity = '1';
        });
        open.style.display = 'none';
        close.style.display = 'flex';
    });

    close.addEventListener('click', function() {
    navitems.forEach((navitem) => {
        navitem.style.display = 'none';
        navitem.style.opacity = '0';
    });
    open.style.display = 'flex';
    close.style.display = 'none';
    });
    */

    // when user clicks on anchor-link, scroll to the heading
    const anchorLinks = document.querySelectorAll('.heading-wrapper');
    anchorLinks.forEach((anchorLink) => {
        anchorLink.addEventListener('click', function(event) {
            event.preventDefault();
            const hashId = anchorLink.lastChild.href;
            const heading = document.getElementById(hashId.split('#')[1]);
            heading.scrollIntoView({ behavior: 'smooth' });
            // append hashId to the URL
            window.history.pushState(null, null, hashId);
        });
    });
    document.querySelectorAll('a').forEach(function(link) {
        if (link.hostname !== window.location.hostname) {
            link.setAttribute('target', '_blank');
        }
    });
});
