// Load pages inside iframe without opening a new tab
const menuLinks = document.querySelectorAll('.menu-link');
const iframe = document.getElementById('page-frame');

menuLinks.forEach(link => {
    link.addEventListener('click', function(e){
        e.preventDefault();
        // Remove active class from all links
        menuLinks.forEach(l => l.classList.remove('active'));
        this.classList.add('active');

        // Load the page inside iframe
        iframe.src = this.getAttribute('href');
    });
});
