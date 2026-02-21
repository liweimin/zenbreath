(function bootstrapMain(ns) {
  function init() {
    ns.initDomRefs();
    ns.persistence.loadPersisted();
    ns.exposeLegacyGlobals();
    ns.visual.initVisual();
    ns.session.initSession();
    ns.ui.initUI();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})(window.ZenBreath || (window.ZenBreath = {}));
