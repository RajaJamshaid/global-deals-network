/*
 * GDN Mini App - Phase 1 navigation (Home / Stores / Categories /
 * TrendTop Deals).
 *
 * Purely presentational tab-switching for the four nav boxes below
 * the hero - no business logic, no API calls, no affiliate routing.
 * Plain vanilla JS, no framework or build step, consistent with the
 * rest of this Phase 1 shell (see commit history: this sandbox has
 * no network access to verify an npm-based build).
 */
(function () {
  var boxes = document.querySelectorAll('.nav-box');
  var panels = document.querySelectorAll('.gdn-panel');

  boxes.forEach(function (box) {
    box.addEventListener('click', function () {
      var target = box.getAttribute('data-panel');

      boxes.forEach(function (b) {
        var active = b === box;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', active ? 'true' : 'false');
      });

      panels.forEach(function (panel) {
        panel.hidden = panel.getAttribute('data-panel-content') !== target;
      });
    });
  });
})();
