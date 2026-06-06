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
    if (v) {
      el.href = v;
      el.removeAttribute('aria-disabled');
      el.classList.remove('is-disabled');
      // external payment link → open safely in a new tab
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener');
    } else {
      // keep it visibly inert until a real link is configured
      el.classList.add('is-disabled');
      el.setAttribute('aria-disabled', 'true');
    }
  });

  // Hide "pending"/SAMPLE markers once their source value is filled in.
  document.querySelectorAll('[data-when-empty]').forEach(function (el) {
    if (S[el.getAttribute('data-when-empty')]) el.hidden = true;
  });
  // mailto links
  document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) {
    a.href = 'mailto:' + S.email;
    if (a.getAttribute('data-fill') === 'email') a.textContent = S.email;
  });
})();
