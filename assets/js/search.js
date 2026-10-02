/* Asanoha shop search: rotating placeholder, voice, clear, sticky bar, result count */
(function () {
  'use strict';
  var TERMS = ['gummies', 'oil', 'ashwagandha', '250 mg', 'shilajit', 'low strength', 'isabgol', 'roll-on', 'tablets', 'sunset'];
  var EVERY = 2600, SWAP = 260;

  function init() {
    var box = document.getElementById('ash-search'), q = document.getElementById('ash-q');
    if (!box || !q) return;
    var ph = document.getElementById('ash-ph'), word = document.getElementById('ash-ph-word');
    var clear = document.getElementById('ash-s-clear'), mic = document.getElementById('ash-mic'), div = document.getElementById('ash-s-div');
    var count = document.getElementById('ash-s-count'), shop = box.closest('.ash-shop');
    var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var i = 0, timer = null, listening = false;

    // JS is running, so swap the static placeholder for the animated one
    q.setAttribute('placeholder', '');
    ph.hidden = false;
    box.classList.add('dyn');

    function setWord(t) { word.textContent = '\u201C' + t + '\u201D'; }
    function tick() {
      if (document.hidden || q.value || listening) return;
      i = (i + 1) % TERMS.length;
      if (still) { setWord(TERMS[i]); return; }
      word.classList.add('out');
      setTimeout(function () {
        setWord(TERMS[i]);
        word.classList.remove('out'); word.classList.add('pre');
        void word.offsetWidth;
        word.classList.remove('pre');
      }, SWAP);
    }
    setWord(TERMS[0]);
    timer = setInterval(tick, EVERY);

    function sync() {
      var has = q.value.length > 0;
      ph.hidden = has;
      clear.hidden = !has;
      if (shop) shop.classList.toggle('searching', has);
      if (count) {
        if (!has) { count.hidden = true; return; }
        // shop.js renders the grid on the same input event, so read it on the next frame
        requestAnimationFrame(function () {
          var n = document.querySelectorAll('#ash-grid .ash-p').length;
          count.hidden = n === 0;
          count.textContent = n + (n === 1 ? ' product' : ' products') + ' for \u201C' + q.value.trim() + '\u201D';
        });
      }
      if (has) {
        // if the matching tiles have scrolled up behind the sticky bar, bring them back under it
        requestAnimationFrame(function () {
          var g = document.getElementById('ash-grid'); if (!g) return;
          var gap = g.getBoundingClientRect().top - box.getBoundingClientRect().bottom - 14;
          if (gap < 0) window.scrollTo({ top: window.scrollY + gap, behavior: 'auto' });
        });
      }
    }
    function setQuery(v) {
      q.value = v;
      q.dispatchEvent(new Event('input', { bubbles: true }));
    }
    q.addEventListener('input', sync);
    q.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && q.value) { setQuery(''); }
      if (e.key === 'Enter') { q.blur(); }
    });
    clear.addEventListener('click', function () { setQuery(''); q.focus(); });

    // voice search where the browser supports it
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      mic.hidden = false; div.hidden = false;
      var rec = new SR(); rec.lang = 'en-IN'; rec.interimResults = true; rec.maxAlternatives = 1;
      var stop = function () { listening = false; box.classList.remove('listening'); mic.setAttribute('aria-pressed', 'false'); if (!q.value) setWord(TERMS[i]); };
      rec.onresult = function (e) {
        var t = ''; for (var k = e.resultIndex; k < e.results.length; k++) t += e.results[k][0].transcript;
        setQuery(t.replace(/[.?!]+$/, '').trim());
      };
      rec.onerror = function () { stop(); };
      rec.onend = stop;
      mic.addEventListener('click', function () {
        if (listening) { rec.stop(); return; }
        try {
          rec.start(); listening = true; box.classList.add('listening'); mic.setAttribute('aria-pressed', 'true');
          setQuery(''); word.textContent = 'Listening\u2026';
        } catch (err) { stop(); }
      });
    }

    // soft shadow once the bar sticks under the header
    var ticking = false;
    function stuck() {
      ticking = false;
      var top = parseFloat(getComputedStyle(box).top) || 0;
      box.classList.toggle('stuck', box.getBoundingClientRect().top <= top + 1 && window.scrollY > 0);
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(stuck); } }, { passive: true });
    stuck();

    // keep the results in view while typing
    q.addEventListener('focus', function () {
      var r = box.getBoundingClientRect();
      if (r.top > window.innerHeight * 0.5) box.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { clearInterval(timer); timer = null; } else if (!timer) { timer = setInterval(tick, EVERY); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
