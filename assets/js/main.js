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
// Inquiry form → opens WhatsApp with the message pre-filled (no backend needed).
(function () {
  var f = document.getElementById('inquiry-form');
  if (!f) return;
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = new FormData(f);
    var num = (window.SITE && window.SITE.waNumber) || '2347036190935';
    var msg = 'Hello! My name is ' + d.get('name') +
      '. Keeper age group: ' + d.get('age') + '. ' + d.get('body');
    window.open('https://wa.me/' + num + '?text=' + encodeURIComponent(msg),
      '_blank', 'noopener');
  });
})();
