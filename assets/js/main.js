// Minimal JS: nav toggle, current-page highlight, scroll-reveal. No dependencies.
document.getElementById('nav-toggle').addEventListener('click', function () {
  document.querySelector('nav.main').classList.toggle('open');
});
(function () {
  var here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav.main a').forEach(function (a) {
    if (a.getAttribute('href') === here) a.setAttribute('aria-current', 'page');
  });
})();
// Reveal cards/quotes/stats as they scroll into view (CSS handles reduced-motion).
(function () {
  var els = document.querySelectorAll('.card, blockquote, .stats > div');
  if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: 0.12 });
  els.forEach(function (e) { io.observe(e); });
})();
