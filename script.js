// Toggle navigation menu on small screens
document.addEventListener('DOMContentLoaded', function () {
  var menuToggle = document.getElementById('menu-toggle');
  var navList = document.querySelector('.main-nav > ul');
  if (menuToggle && navList) {
    menuToggle.addEventListener('click', function () {
      navList.classList.toggle('open');
    });
  }
});