// ============================================================
// SINGLE SOURCE OF TRUTH for all contact/business details.
// When real details arrive, edit ONLY this file — every page
// updates automatically. Values marked TODO are placeholders.
// ============================================================
window.SITE = {
  // WhatsApp number, digits only, international format (no +)
  waNumber: "2347036190935",
  phoneDisplay: "+234 703 619 0935",
  email: "akindekotobi3@gmail.com",
  paystackUrl: "",                      // TODO: intake Q31 — payment page URL
  instagram: "",                        // TODO: not yet provided
  facebook: "",                         // TODO: not yet provided
  tiktok: "https://www.tiktok.com/@ilerioluwa.goalke",
  youtube: "https://www.youtube.com/@ilerigktrainingcenter",
  mapsMain: "",                         // TODO: Google Maps pin URL pending
};

// ---- filler: applies SITE values to the page ----
(function () {
  var S = window.SITE;

  // Rewrite every wa.me link to the configured number, keeping ?text= prefills.
  document.querySelectorAll('a[href*="wa.me"]').forEach(function (a) {
    if (!/wa\.me\/\d/.test(a.href)) return; // number-less share links (e.g. invite-a-friend) stay as-is
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
