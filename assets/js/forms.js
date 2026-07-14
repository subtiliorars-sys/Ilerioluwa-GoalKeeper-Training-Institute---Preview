// ============================================================
// WhatsApp-prefill forms — the zero-backend registration funnel.
// A <form class="wa-form" data-wa-intro="..."> is intercepted on
// submit: its fields are formatted into a single WhatsApp message
// and the visitor is handed off to the Center's WhatsApp chat with
// everything pre-typed. Nothing is stored or sent anywhere else —
// the parent presses send. Works on every phone with WhatsApp.
//
// Progressive enhancement: if JS is off, the form keeps its native
// action (a mailto fallback), so it never becomes a dead end.
// ============================================================
(function () {
  var S = window.SITE || {};
  var forms = document.querySelectorAll('form.wa-form');
  if (!forms.length) return;

  // Build "Label: value" lines from fields that have a data-wa-label.
  function compose(form) {
    var lines = [];
    var intro = form.getAttribute('data-wa-intro');
    if (intro) { lines.push(intro); lines.push(''); }
    form.querySelectorAll('[data-wa-label]').forEach(function (el) {
      var label = el.getAttribute('data-wa-label');
      var val = (el.value || '').trim();
      if (val) lines.push(label + ': ' + val);
    });
    return lines.join('\n');
  }

  forms.forEach(function (form) {
    form.addEventListener('submit', function (e) {
      var num = (window.SITE || {}).waNumber;
      if (!num) return; // no number configured → let native action run
      e.preventDefault();
      if (!form.reportValidity()) return;
      var text = compose(form);
      var url = 'https://wa.me/' + num + '?text=' + encodeURIComponent(text);
      window.open(url, '_blank', 'noopener');

      // Confirmation so the visitor knows the handoff happened.
      var note = form.querySelector('.wa-sent');
      if (note) { note.hidden = false; }
    });
  });
})();
