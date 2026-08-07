/* IPP used reactors page
   Tab switching, faceted inventory filtering, sorting and progressive reveal. */

(function () {
  'use strict';

  /* ---------------- tabs ---------------- */
  document.querySelectorAll('[role="tablist"]').forEach(function (list) {
    var tabs = [].slice.call(list.querySelectorAll('.tab'));
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        tabs.forEach(function (o) {
          o.setAttribute('aria-selected', 'false');
          var p = document.getElementById(o.dataset.p);
          if (p) { p.hidden = true; }
        });
        t.setAttribute('aria-selected', 'true');
        var panel = document.getElementById(t.dataset.p);
        if (panel) { panel.hidden = false; }
      });
    });
  });

  /* ---------------- faceted filtering ---------------- */
  var grid = document.getElementById('pgrid');
  if (!grid) { return; }

  var GROUPS = ['type', 'material', 'agit', 'cond', 'mfr', 'bar', 'temp'];
  var PAGE = 9;

  var cards = [].slice.call(grid.querySelectorAll('.pcard'));
  var boxes = [].slice.call(document.querySelectorAll('#filters input[type="checkbox"]'));
  var capMin = document.getElementById('capMin');
  var capMax = document.getElementById('capMax');
  var capMinTxt = document.getElementById('capMinTxt');
  var capMaxTxt = document.getElementById('capMaxTxt');
  var fill = document.getElementById('fill');
  var countEl = document.getElementById('resultCount');
  var chipsEl = document.getElementById('activeChips');
  var emptyEl = document.getElementById('emptyState');
  var seeMoreWrap = document.getElementById('seeMoreWrap');
  var seeMore = document.getElementById('seeMore');
  var sorter = document.getElementById('sortA');

  var CAP_FLOOR = parseInt(capMin.min, 10);
  var CAP_CEIL = parseInt(capMax.max, 10);
  var shown = PAGE;

  var LABELS = {};
  boxes.forEach(function (b) {
    var text = b.parentElement.textContent.replace(/\s+/g, ' ').trim();
    LABELS[b.dataset.g + ':' + b.value] = text;
  });

  function nfmt(n) { return n.toLocaleString('en-US'); }

  function selections() {
    var sel = {};
    GROUPS.forEach(function (g) { sel[g] = []; });
    boxes.forEach(function (b) { if (b.checked) { sel[b.dataset.g].push(b.value); } });
    return sel;
  }

  function capRange() {
    var lo = parseInt(capMin.value, 10);
    var hi = parseInt(capMax.value, 10);
    return lo <= hi ? [lo, hi] : [hi, lo];
  }

  /* matches every group except `skip`, so facet counts stay meaningful */
  function matches(card, sel, range, skip) {
    for (var i = 0; i < GROUPS.length; i++) {
      var g = GROUPS[i];
      if (g === skip) { continue; }
      var chosen = sel[g];
      if (chosen.length && chosen.indexOf(card.dataset[g === 'material' ? 'material' : g]) === -1) {
        return false;
      }
    }
    if (skip !== 'cap') {
      var narrowed = range[0] > CAP_FLOOR || range[1] < CAP_CEIL;
      if (narrowed) {
        if (card.dataset.cap === '') { return false; }
        var c = parseFloat(card.dataset.cap);
        if (c < range[0] || c > range[1]) { return false; }
      }
    }
    return true;
  }

  function sortCards(list) {
    var mode = sorter ? sorter.value : 'cap-desc';
    return list.slice().sort(function (a, b) {
      /* units with no published capacity sort last in both directions */
      var ca = a.dataset.cap === '' ? null : parseFloat(a.dataset.cap);
      var cb = b.dataset.cap === '' ? null : parseFloat(b.dataset.cap);
      if (mode === 'cap-asc' || mode === 'cap-desc') {
        if (ca === null && cb === null) { return 0; }
        if (ca === null) { return 1; }
        if (cb === null) { return -1; }
        return mode === 'cap-asc' ? ca - cb : cb - ca;
      }
      if (mode === 'bar-desc') {
        return parseFloat(b.dataset.barval) - parseFloat(a.dataset.barval);
      }
      if (mode === 'sku-desc') {
        return parseInt(b.dataset.sku, 10) - parseInt(a.dataset.sku, 10);
      }
      return 0;
    });
  }

  function apply() {
    var sel = selections();
    var range = capRange();

    /* sort first, so the paginated slice is the top N of the chosen order */
    var visible = sortCards(cards.filter(function (c) { return matches(c, sel, range, null); }));

    visible.forEach(function (c) { grid.appendChild(c); });

    cards.forEach(function (c) { c.hidden = true; });
    visible.forEach(function (c, i) { c.hidden = i >= shown; });

    /* facet counts, computed against everything else that is selected */
    boxes.forEach(function (b) {
      var g = b.dataset.g;
      var n = cards.filter(function (c) {
        return c.dataset[g] === b.value && matches(c, sel, range, g);
      }).length;
      var slot = b.parentElement.querySelector('.n');
      if (slot) { slot.textContent = n; }
      b.parentElement.classList.toggle('is-empty', n === 0 && !b.checked);
      b.disabled = n === 0 && !b.checked;
    });

    /* result count */
    var end = Math.min(shown, visible.length);
    countEl.innerHTML = visible.length
      ? '<b>Showing ' + end + '</b> of ' + visible.length + ' reactor' + (visible.length === 1 ? '' : 's')
      : '<b>No reactors</b> match';

    /* active filter chips */
    chipsEl.innerHTML = '';
    boxes.filter(function (b) { return b.checked; }).forEach(function (b) {
      var chip = document.createElement('span');
      chip.className = 'fchip';
      chip.innerHTML = LABELS[b.dataset.g + ':' + b.value].replace(/\s*\d+$/, '') + ' <i>&times;</i>';
      chip.querySelector('i').addEventListener('click', function () {
        b.checked = false; shown = PAGE; apply();
      });
      chipsEl.appendChild(chip);
    });
    if (range[0] > CAP_FLOOR || range[1] < CAP_CEIL) {
      var chip2 = document.createElement('span');
      chip2.className = 'fchip';
      chip2.innerHTML = nfmt(range[0]) + ' to ' + nfmt(range[1]) + ' L <i>&times;</i>';
      chip2.querySelector('i').addEventListener('click', function () {
        capMin.value = CAP_FLOOR; capMax.value = CAP_CEIL; syncCap(); shown = PAGE; apply();
      });
      chipsEl.appendChild(chip2);
    }
    chipsEl.hidden = !chipsEl.children.length;

    emptyEl.hidden = visible.length !== 0;
    seeMoreWrap.hidden = visible.length <= shown;
    grid.hidden = visible.length === 0;
  }

  function syncCap() {
    var r = capRange();
    capMinTxt.value = nfmt(r[0]);
    capMaxTxt.value = nfmt(r[1]);
    fill.style.left = ((r[0] - CAP_FLOOR) / (CAP_CEIL - CAP_FLOOR) * 100) + '%';
    fill.style.right = (100 - (r[1] - CAP_FLOOR) / (CAP_CEIL - CAP_FLOOR) * 100) + '%';
  }

  function readTxt(el, slider) {
    var v = parseInt(el.value.replace(/[^\d]/g, ''), 10);
    if (isNaN(v)) { return; }
    slider.value = Math.min(Math.max(v, CAP_FLOOR), CAP_CEIL);
    syncCap(); shown = PAGE; apply();
  }

  boxes.forEach(function (b) {
    b.addEventListener('change', function () { shown = PAGE; apply(); });
  });
  [capMin, capMax].forEach(function (s) {
    s.addEventListener('input', function () { syncCap(); shown = PAGE; apply(); });
  });
  capMinTxt.addEventListener('change', function () { readTxt(capMinTxt, capMin); });
  capMaxTxt.addEventListener('change', function () { readTxt(capMaxTxt, capMax); });
  if (sorter) { sorter.addEventListener('change', function () { apply(); }); }
  seeMore.addEventListener('click', function () { shown += PAGE; apply(); });

  function clearAll() {
    boxes.forEach(function (b) { b.checked = false; });
    capMin.value = CAP_FLOOR;
    capMax.value = CAP_CEIL;
    syncCap();
    shown = PAGE;
    apply();
  }
  document.getElementById('resetBtn').addEventListener('click', clearAll);
  document.getElementById('clearFromEmpty').addEventListener('click', clearAll);

  syncCap();
  apply();
})();
