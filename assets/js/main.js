// Minimal JS: mobile nav toggle + current-page highlight. No dependencies.
document.getElementById('nav-toggle').addEventListener('click', function () {
  document.querySelector('nav.main').classList.toggle('open');
});
(function () {
  var here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav.main a').forEach(function (a) {
    if (a.getAttribute('href') === here) a.setAttribute('aria-current', 'page');
  });
})();
