// ============================================================
// SINGLE SOURCE OF TRUTH for all contact/business details.
// When real details arrive, edit ONLY this file — every page
// updates automatically. Values marked TODO are placeholders.
// ============================================================
window.SITE = {
  // WhatsApp number, digits only, international format (no +)
  waNumber: "2340000000000",            // TODO: real number (intake Q8)
  phoneDisplay: "+234 000 000 0000",    // TODO: intake Q8/Q9
  email: "hello@example.com",           // TODO: intake Q10
  paystackUrl: "",                      // TODO: intake Q31 — payment page URL
  instagram: "",                        // TODO: intake Q11 — full URL
  facebook: "",                         // TODO: full URL
  tiktok: "",                           // TODO: full URL
  youtube: "",                          // TODO: full URL
  mapsMain: "",                         // TODO: intake Q21 — Google Maps pin URL
};

// ---- filler: applies SITE values to the page ----
(function () {
  var S = window.SITE;

  // Rewrite every wa.me link to the configured number, keeping ?text= prefills.
  document.querySelectorAll('a[href*="wa.me"]').forEach(function (a) {
    var q = a.href.split('?')[1];
    a.href = 'https://wa.me/' + S.waNumber + (q ? '?' + q : '');
  });

  // <span data-fill="phoneDisplay"> → text; <a data-fill-href="paystackUrl"> → href.
  document.querySelectorAll('[data-fill]').forEach(function (el) {
    var v = S[el.getAttribute('data-fill')];
    if (v) el.textContent = v;
  });
  document.querySelectorAll('[data-fill-href]').forEach(function (el) {
    var v = S[el.getAttribute('data-fill-href')];
    if (v) { el.href = v; el.removeAttribute('aria-disabled'); }
  });
  // mailto links
  document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) {
    a.href = 'mailto:' + S.email;
    if (a.getAttribute('data-fill') === 'email') a.textContent = S.email;
  });
})();
