(function () {
  'use strict';

  var KEY = 'asanoha:tools-adult';
  var $ = function (s, r) { return (r || document).querySelector(s); };

  function adultGate() {
    var gate = $('#tools-gate');
    if (!gate) return;
    var yes = $('#tools-gate-yes');
    var no = $('#tools-gate-no');
    var msg = $('#tools-gate-msg');

    if (localStorage.getItem(KEY) !== 'yes') {
      gate.classList.add('show');
      document.body.classList.add('lock');
      setTimeout(function () { if (yes) yes.focus(); }, 50);
    }

    if (yes) yes.addEventListener('click', function () {
      localStorage.setItem(KEY, 'yes');
      gate.classList.remove('show');
      document.body.classList.remove('lock');
      if (window.gtag) window.gtag('event', 'tools_age_confirmed');
    });

    if (no) no.addEventListener('click', function () {
      if (msg) msg.hidden = false;
    });
  }

  function track(name, params) {
    params = params || {};
    try { if (window.gtag) window.gtag('event', name, params); } catch (e) {}
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function shuffle(a) {
    var b = a.slice();
    for (var i = b.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = b[i]; b[i] = b[j]; b[j] = t;
    }
    return b;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
    });
  }

  function share(text, url) {
    if (navigator.share) {
      return navigator.share({ title: document.title, text: text, url: url || location.href })
        .catch(function () {});
    }
    return navigator.clipboard ? navigator.clipboard.writeText((text ? text + '\n' : '') + (url || location.href))
      .then(function () { alert('Copied. Send it to your other half.'); })
      .catch(function () { prompt('Copy this:', (text ? text + '\n' : '') + (url || location.href)); })
      : Promise.resolve(prompt('Copy this:', (text ? text + '\n' : '') + (url || location.href)));
  }

  window.AsanohaTools = {
    adultGate: adultGate,
    track: track,
    pick: pick,
    shuffle: shuffle,
    esc: esc,
    share: share
  };

  document.addEventListener('DOMContentLoaded', adultGate);
}());
