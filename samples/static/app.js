
(function () {
  function initFilter(root) {
    var rows = root.querySelectorAll("tbody tr");
    var chips = root.parentElement.querySelectorAll(".chip[data-q]");
    var search = root.parentElement.querySelector("input[type=search]");
    var active = "all";

    function apply() {
      var needle = (search && search.value || "").trim().toLowerCase();
      rows.forEach(function (r) {
        var q = r.getAttribute("data-q") || "";
        var sid = (r.getAttribute("data-sid") || "").toLowerCase();
        var qOk = active === "all" || q === active;
        var sOk = !needle || sid.indexOf(needle) !== -1;
        r.style.display = (qOk && sOk) ? "" : "none";
      });
    }
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        chips.forEach(function (x) { x.classList.remove("active"); });
        c.classList.add("active");
        active = c.getAttribute("data-q");
        apply();
      });
    });
    if (search) search.addEventListener("input", apply);
    apply();
  }

  function initLink(root) {
    root.querySelectorAll("tbody tr.linked").forEach(function (r) {
      r.addEventListener("click", function () {
        var href = r.getAttribute("data-href");
        if (href) window.location.href = href;
      });
    });
  }

  function initToggle() {
    var groups = document.querySelectorAll("[data-toggle-group]");
    groups.forEach(function (g) {
      var btns = g.querySelectorAll(".toggle[data-target]");
      btns.forEach(function (b) {
        b.addEventListener("click", function () {
          btns.forEach(function (x) { x.classList.remove("active"); });
          b.classList.add("active");
          var target = b.getAttribute("data-target");
          var name = g.getAttribute("data-toggle-group");
          document.querySelectorAll("[data-tgroup=\"" + name + "\"]").forEach(function (panel) {
            panel.style.display = (panel.getAttribute("data-tkey") === target) ? "" : "none";
          });
        });
      });
    });
  }

  function initPagination() {
    var navEls = document.querySelectorAll("nav.pagination");
    navEls.forEach(function (nav) {
      var pageBtns = Array.prototype.slice.call(
        nav.querySelectorAll(".page-btn[data-page]")
      );
      var prevBtn = nav.querySelector(".page-prev");
      var nextBtn = nav.querySelector(".page-next");
      if (!pageBtns.length) return;
      var current = 1;

      function activate(p) {
        current = p;
        pageBtns.forEach(function (b) {
          b.classList.toggle("active",
            parseInt(b.getAttribute("data-page"), 10) === p);
        });
        document.querySelectorAll(".hl-tile[data-page]").forEach(function (t) {
          var tp = parseInt(t.getAttribute("data-page"), 10);
          t.classList.toggle("is-on", tp === p);
        });
        var maxP = pageBtns.length;
        if (prevBtn) prevBtn.disabled = (p <= 1);
        if (nextBtn) nextBtn.disabled = (p >= maxP);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      pageBtns.forEach(function (b) {
        b.addEventListener("click", function () {
          activate(parseInt(b.getAttribute("data-page"), 10));
        });
      });
      if (prevBtn) prevBtn.addEventListener("click", function () {
        if (current > 1) activate(current - 1);
      });
      if (nextBtn) nextBtn.addEventListener("click", function () {
        if (current < pageBtns.length) activate(current + 1);
      });
      activate(1);
    });
  }

  function initBaselineTabs() {
    var bars = document.querySelectorAll(".baseline-tabs");
    bars.forEach(function (bar) {
      var tabs = bar.querySelectorAll(".baseline-tab");
      var stack = bar.parentElement.querySelector(".left-stack");
      if (!stack) return;
      var split = stack.parentElement;        // the .split grid container
      var panes = stack.querySelectorAll(".baseline-pane");
      tabs.forEach(function (t) {
        t.addEventListener("click", function () {
          if (t.classList.contains("disabled")) return;
          var key = t.getAttribute("data-pane");
          var alreadyActive = t.classList.contains("active");
          if (alreadyActive) {
            // Re-clicking the active tab → collapse the left pane and let
            // SpatialClaw take the full width.
            tabs.forEach(function (x) { x.classList.remove("active"); });
            panes.forEach(function (p) { p.classList.remove("is-on"); });
            split.classList.add("agent-only");
          } else {
            tabs.forEach(function (x) { x.classList.remove("active"); });
            t.classList.add("active");
            panes.forEach(function (p) {
              p.classList.toggle("is-on",
                p.getAttribute("data-pane") === key);
            });
            split.classList.remove("agent-only");
          }
        });
      });
    });
  }

  function initSampleNavKeys() {
    var prev = document.querySelector(".sample-nav.prev");
    var next = document.querySelector(".sample-nav.next");
    if (!prev && !next) return;
    document.addEventListener("keydown", function (e) {
      // Ignore when the user is typing into a form control.
      var tag = (e.target && e.target.tagName) ? e.target.tagName.toUpperCase() : "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowLeft" && prev) {
        e.preventDefault();
        window.location.href = prev.getAttribute("href");
      } else if (e.key === "ArrowRight" && next) {
        e.preventDefault();
        window.location.href = next.getAttribute("href");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("table.samples").forEach(function (t) {
      initFilter(t);
      initLink(t);
    });
    initToggle();
    initPagination();
    initBaselineTabs();
    initSampleNavKeys();
  });
})();
