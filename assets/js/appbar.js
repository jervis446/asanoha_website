/* Asanoha phone app bar: delivery time, address, account, search and categories pinned at the top
   of the home page, like quick-commerce apps. The delivery row scrolls away, search and categories stay.
   Desktop keeps them inside the shop section. Same elements are moved, so every handler keeps working. */
(function () {
  'use strict';
  var mq = window.matchMedia && matchMedia('(max-width: 640px)');
  if (!mq) return;
  function $(s, r) { return (r || document).querySelector(s); }

  function init() {
    var del = $('#ash-deliver'), box = $('#ash-search'), tabs = $('.ash-shop .ash-tabs'), main = $('#main'), grid = $('#ash-grid');
    if (!del || !box || !tabs || !main) return;
    var home = document.createComment('ash-appbar-home');
    del.parentNode.insertBefore(home, del);

    var bar = document.createElement('div'); bar.className = 'ash-appbar'; bar.id = 'ash-appbar';
    var row = document.createElement('div'); row.className = 'ash-ab-top';
    var acts = document.createElement('div'); acts.className = 'ash-ab-acts';
    // same buttons as the header (Noha Money, account); the header itself is hidden in this mode
    ['.top .ash-coinbtn', '.top .ash-mebtn'].forEach(function (s) {
      var b = $(s); if (b) { var c = b.cloneNode(true); c.removeAttribute('id'); acts.appendChild(c); }
    });

    // icons for the category tabs; CSS shows them only inside the app bar
    var S = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
    var ICONS = {
      all: S + '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/></svg>',
      gummies: S + '<circle cx="7.5" cy="6.5" r="2.5"/><circle cx="16.5" cy="6.5" r="2.5"/><path d="M6 14a6 6 0 0 1 12 0v2.5a4.5 4.5 0 0 1-4.5 4.5h-3A4.5 4.5 0 0 1 6 16.5z"/><path d="M10 13h.01M14 13h.01"/></svg>',
      oil: S + '<path d="M12 3.5c-3.2 4.6-5.2 7.4-5.2 10.2a5.2 5.2 0 0 0 10.4 0c0-2.8-2-5.6-5.2-10.2z"/><path d="M9.6 14.5a2.6 2.6 0 0 0 2.4 2.4"/></svg>',
      tablets: S + '<rect x="2.8" y="8.2" width="18.4" height="7.6" rx="3.8" transform="rotate(-35 12 12)"/><path d="M9.8 8.9l4.4 6.2"/></svg>',
      wellness: S + '<path d="M5 19c0-8.2 5.2-13.8 15-15-1.2 9.8-6.8 15-15 15z"/><path d="M5 19l8.5-8.5"/></svg>',
      low: S + '<path d="M6 19v-4"/><path d="M12 19V11" opacity=".3"/><path d="M18 19V6" opacity=".3"/></svg>',
      high: S + '<path d="M6 19v-4"/><path d="M12 19V11"/><path d="M18 19V6"/></svg>'
    };
    Array.prototype.forEach.call(tabs.querySelectorAll('[data-ash-f]'), function (b) {
      var ic = ICONS[b.getAttribute('data-ash-f')];
      if (!ic || b.querySelector('.ash-tab-ico')) return;
      var sp = document.createElement('span'); sp.className = 'ash-tab-ico'; sp.innerHTML = ic;
      b.insertBefore(sp, b.firstChild);
    });

    function measure() {
      // collapse everything above the search bar, keep 10px of band above it
      bar.style.setProperty('--ab-collapse', Math.max(0, box.offsetTop - 10) + 'px');
    }
    function on() {
      if (bar.isConnected) return;
      row.appendChild(del); row.appendChild(acts);
      bar.appendChild(row); bar.appendChild(box); bar.appendChild(tabs);
      main.parentNode.insertBefore(bar, main);
      document.documentElement.classList.add('ash-appmode');
      measure();
    }
    function off() {
      if (!bar.isConnected) return;
      home.parentNode.insertBefore(tabs, home.nextSibling);
      home.parentNode.insertBefore(box, home.nextSibling);
      home.parentNode.insertBefore(del, home.nextSibling);
      bar.remove();
      document.documentElement.classList.remove('ash-appmode');
    }
    function apply() { if (mq.matches) on(); else off(); }
    apply();
    (mq.addEventListener ? mq.addEventListener('change', apply) : mq.addListener(apply));
    window.addEventListener('resize', function () { if (bar.isConnected) measure(); });
    // the address line changes length after a location is set
    if (window.MutationObserver) new MutationObserver(function () { if (bar.isConnected) measure(); }).observe(del, { childList: true, subtree: true });

    // puts the first product row right under the pinned search and categories
    function toGrid() {
      if (!bar.isConnected || !grid) return false;
      var collapsed = parseFloat(bar.style.getPropertyValue('--ab-collapse')) || 0;
      var want = bar.offsetHeight - collapsed + 12, now = grid.getBoundingClientRect().top;
      if (Math.abs(now - want) > 24) window.scrollTo({ top: now + window.scrollY - want, behavior: 'auto' });
      return true;
    }
    window.AsanohaAppbar = { toGrid: toGrid, el: bar };
    tabs.addEventListener('click', function (e) {
      if (e.target.closest('button')) requestAnimationFrame(toGrid);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
