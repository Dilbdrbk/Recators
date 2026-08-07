/* IPP used reactors page.
   Tabs, the hero read more toggle, and the inventory filter.

   The filter works entirely off data attributes on the cards, so it filters by
   what is actually in stock on the page. Facet counts are counted from those
   cards rather than written by hand, and a facet that can return nothing is
   greyed out. */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Tabs
     ------------------------------------------------------------------ */
  document.querySelectorAll('[role="tablist"]').forEach(function (list) {
    var tabs = [].slice.call(list.querySelectorAll('.tab'));

    function select(tab) {
      tabs.forEach(function (t) {
        var panel = document.getElementById(t.dataset.p);
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.setAttribute('tabindex', on ? '0' : '-1');
        if (panel) { panel.hidden = !on; }
      });
    }

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight') { next = tabs[(i + 1) % tabs.length]; }
        if (e.key === 'ArrowLeft') { next = tabs[(i - 1 + tabs.length) % tabs.length]; }
        if (next) { e.preventDefault(); select(next); next.focus(); }
      });
    });
  });

  /* ------------------------------------------------------------------
     Hero read more
     ------------------------------------------------------------------ */
  var ledeMore = document.getElementById('ledeMore');
  var ledeOpen = document.getElementById('ledeToggle');
  var ledeClose = document.getElementById('ledeToggleClose');

  function setLede(open) {
    if (!ledeMore || !ledeOpen) { return; }
    ledeMore.hidden = !open;
    ledeOpen.setAttribute('aria-expanded', open ? 'true' : 'false');
    ledeOpen.hidden = open;
  }
  if (ledeOpen) { ledeOpen.addEventListener('click', function () { setLede(true); }); }
  if (ledeClose) { ledeClose.addEventListener('click', function () { setLede(false); }); }

  /* ------------------------------------------------------------------
     Inventory filter
     ------------------------------------------------------------------ */
  var grid = document.getElementById('pgrid');
  if (!grid) { return; }

  var cards = [].slice.call(grid.querySelectorAll('.pcard'));
  var panel = document.getElementById('filters');
  var boxes = [].slice.call(panel.querySelectorAll('input[type="checkbox"]'));
  var countEl = document.getElementById('resultCount');
  var chipsEl = document.getElementById('activeChips');
  var emptyEl = document.getElementById('emptyState');
  var seeMore = document.getElementById('seeMore');
  var seeMoreWrap = document.getElementById('seeMoreWrap');
  var sorter = document.getElementById('sortA');
  var resetBtn = document.getElementById('resetBtn');
  var clearBtn = document.getElementById('clearFromEmpty');

  var PAGE = 9;
  var shown = PAGE;

  /* readable label per checkbox, for the active filter chips */
  var LABELS = {};
  boxes.forEach(function (b) {
    LABELS[b.dataset.g + ':' + b.value] = b.parentNode.textContent.replace(/\s+/g, ' ').trim();
  });

  /* Every facet value is precomputed onto the card as a data attribute, and the
     group name on each checkbox matches its attribute, so this is a direct read.
     A blank value means the unit has no published figure for that attribute, and
     it is correctly excluded when that facet is applied. */
  function facet(card, group) {
    return card.dataset[group] || null;
  }

  /* { group: [values] } for every ticked box, optionally ignoring one group */
  function selections(skip) {
    var sel = {};
    boxes.forEach(function (b) {
      if (!b.checked || b.dataset.g === skip) { return; }
      (sel[b.dataset.g] = sel[b.dataset.g] || []).push(b.value);
    });
    return sel;
  }

  function matches(card, sel) {
    for (var g in sel) {
      if (!Object.prototype.hasOwnProperty.call(sel, g)) { continue; }
      var v = facet(card, g);
      if (v === null || sel[g].indexOf(v) === -1) { return false; }
    }
    return true;
  }

  function sortCards(list) {
    var mode = sorter ? sorter.value : 'cap-desc';
    return list.slice().sort(function (a, b) {
      /* units with no published capacity sort last in either direction */
      if (mode === 'cap-asc' || mode === 'cap-desc') {
        var ca = a.dataset.cap === '' ? null : parseFloat(a.dataset.cap) || null;
        var cb = b.dataset.cap === '' ? null : parseFloat(b.dataset.cap) || null;
        if (ca === null && cb === null) { return 0; }
        if (ca === null) { return 1; }
        if (cb === null) { return -1; }
        return mode === 'cap-asc' ? ca - cb : cb - ca;
      }
      if (mode === 'bar-desc') {
        return (parseFloat(b.dataset.barval) || 0) - (parseFloat(a.dataset.barval) || 0);
      }
      return 0;
    });
  }

  function updateCounts() {
    boxes.forEach(function (b) {
      var sel = selections(b.dataset.g);
      var n = cards.filter(function (c) {
        return facet(c, b.dataset.g) === b.value && matches(c, sel);
      }).length;
      var out = b.parentNode.querySelector('.n');
      if (out) { out.textContent = n; }
      b.parentNode.classList.toggle('is-empty', n === 0 && !b.checked);
    });
  }

  function updateChips() {
    if (!chipsEl) { return; }
    chipsEl.innerHTML = '';
    boxes.filter(function (b) { return b.checked; }).forEach(function (b) {
      var chip = document.createElement('span');
      chip.className = 'chip';
      chip.innerHTML = LABELS[b.dataset.g + ':' + b.value].replace(/\s*\d+$/, '') + ' <i>&times;</i>';
      chip.querySelector('i').addEventListener('click', function () {
        b.checked = false;
        shown = PAGE;
        apply();
      });
      chipsEl.appendChild(chip);
    });
    chipsEl.hidden = !chipsEl.children.length;
  }

  function apply() {
    var sel = selections(null);
    var visible = sortCards(cards.filter(function (c) { return matches(c, sel); }));

    cards.forEach(function (c) { c.hidden = true; });
    visible.forEach(function (c, i) {
      grid.appendChild(c);
      c.hidden = i >= shown;
    });

    var showing = Math.min(shown, visible.length);
    if (countEl) {
      countEl.textContent = visible.length
        ? 'Showing ' + showing + ' of ' + visible.length + ' reactors'
        : 'No reactors match';
    }
    if (emptyEl) { emptyEl.hidden = visible.length !== 0; }
    grid.hidden = visible.length === 0;
    if (seeMoreWrap) { seeMoreWrap.hidden = visible.length <= shown; }

    updateCounts();
    updateChips();
  }

  boxes.forEach(function (b) {
    b.addEventListener('change', function () { shown = PAGE; apply(); });
  });
  if (sorter) { sorter.addEventListener('change', function () { apply(); }); }
  if (seeMore) {
    seeMore.addEventListener('click', function () { shown += PAGE; apply(); });
  }

  function clearAll() {
    boxes.forEach(function (b) { b.checked = false; });
    shown = PAGE;
    apply();
  }
  if (resetBtn) { resetBtn.addEventListener('click', clearAll); }
  if (clearBtn) { clearBtn.addEventListener('click', clearAll); }

  apply();
})();
