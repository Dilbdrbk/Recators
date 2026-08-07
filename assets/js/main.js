(function () {
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

    document.querySelectorAll('.reset').forEach(function (b) {
      b.addEventListener('click', function () {
        b.closest('aside').querySelectorAll('input[type="checkbox"]').forEach(function (c) { c.checked = false; });
      });
    });
  })();
