(function bootstrapUI(ns) {
  const state = ns.state;
  const dom = ns.dom;
  const PRESET_MODES = ["4-4-4-4", "4-7-8-0", "5-0-5-0", "custom"];
  const PRESET_TIMERS = ["5", "10", "custom", "0"];

  function openSettingsOverlay() {
    dom.settingsOverlay.classList.remove("hidden");
    setTimeout(() => {
      dom.settingsOverlay.classList.remove("opacity-0", "pointer-events-none");
      dom.settingsOverlay.classList.add("opacity-100", "pointer-events-auto");
      dom.settingsPanel.classList.remove("scale-95");
      dom.settingsPanel.classList.add("scale-100");
    }, 10);
  }

  function closeSettingsOverlay() {
    dom.settingsOverlay.classList.remove("opacity-100", "pointer-events-auto");
    dom.settingsOverlay.classList.add("opacity-0", "pointer-events-none");
    dom.settingsPanel.classList.remove("scale-100");
    dom.settingsPanel.classList.add("scale-95");
    setTimeout(() => {
      dom.settingsOverlay.classList.add("hidden");
    }, 400);
  }

  function updateCustomDurations() {
    const customModeBtn = document.querySelector('.mode-btn[data-mode="custom"]');
    if (!customModeBtn.classList.contains("bg-white/20")) return;

    state.durations = {
      inhale: Math.max(0, parseInt(document.getElementById("in-time").value, 10) || 0),
      hold1: Math.max(0, parseInt(document.getElementById("hold1-time").value, 10) || 0),
      exhale: Math.max(0, parseInt(document.getElementById("out-time").value, 10) || 0),
      hold2: Math.max(0, parseInt(document.getElementById("hold2-time").value, 10) || 0),
    };

    if (state.durations.inhale === 0 && state.durations.hold1 === 0 && state.durations.exhale === 0 && state.durations.hold2 === 0) {
      state.durations.inhale = 4;
      document.getElementById("in-time").value = 4;
    }
  }

  function getActiveMode() {
    const active = document.querySelector(".mode-btn.bg-white\\/20");
    return active ? active.dataset.mode : "4-4-4-4";
  }

  function getActiveTimerMode() {
    const active = document.querySelector(".timer-btn.bg-white\\/20");
    return active ? active.dataset.time : "5";
  }

  function setMode(mode, customDurations) {
    const nextMode = PRESET_MODES.includes(mode) ? mode : "custom";
    const customInputs = document.getElementById("custom-inputs");

    document.querySelectorAll(".mode-btn").forEach((b) => {
      b.classList.remove("bg-white/20", "border-white/10");
      b.classList.add("bg-white/5", "border-transparent");
    });

    const btn = document.querySelector(`.mode-btn[data-mode="${nextMode}"]`);
    if (btn) {
      btn.classList.remove("bg-white/5", "border-transparent");
      btn.classList.add("bg-white/20", "border-white/10");
    }

    if (nextMode === "custom") {
      customInputs.classList.remove("hidden");
      customInputs.classList.add("grid");
      const d = customDurations || state.durations;
      document.getElementById("in-time").value = Math.max(0, parseInt(d.inhale, 10) || 0);
      document.getElementById("hold1-time").value = Math.max(0, parseInt(d.hold1, 10) || 0);
      document.getElementById("out-time").value = Math.max(0, parseInt(d.exhale, 10) || 0);
      document.getElementById("hold2-time").value = Math.max(0, parseInt(d.hold2, 10) || 0);
      updateCustomDurations();
      return;
    }

    customInputs.classList.add("hidden");
    customInputs.classList.remove("grid");
    const parts = nextMode.split("-");
    state.durations = {
      inhale: Math.max(0, parseInt(parts[0], 10)),
      hold1: Math.max(0, parseInt(parts[1], 10)),
      exhale: Math.max(0, parseInt(parts[2], 10)),
      hold2: Math.max(0, parseInt(parts[3], 10)),
    };
  }

  function setTimerMode(timerMode, customMinutes) {
    const nextTimer = PRESET_TIMERS.includes(timerMode) ? timerMode : "5";
    const customTimerInput = document.getElementById("custom-timer-input");
    const customMinutesInput = document.getElementById("custom-minutes");

    document.querySelectorAll(".timer-btn").forEach((b) => {
      b.classList.remove("bg-white/20", "text-white", "shadow-sm");
      b.classList.add("text-white/60");
    });

    const btn = document.querySelector(`.timer-btn[data-time="${nextTimer}"]`);
    if (btn) {
      btn.classList.add("bg-white/20", "text-white", "shadow-sm");
      btn.classList.remove("text-white/60");
    }

    if (nextTimer === "custom") {
      const mins = Math.max(1, Math.min(120, parseInt(customMinutes, 10) || parseInt(customMinutesInput.value, 10) || 15));
      customMinutesInput.value = mins;
      customTimerInput.classList.remove("hidden");
      customTimerInput.classList.add("flex");
      state.endlessMode = false;
      state.remainingSessionTime = mins * 60;
      return;
    }

    customTimerInput.classList.add("hidden");
    customTimerInput.classList.remove("flex");
    const mins = parseInt(nextTimer, 10);
    state.endlessMode = mins === 0;
    if (!state.endlessMode) state.remainingSessionTime = mins * 60;
  }

  function setAmbient(ambientType) {
    const ambient = state.ambientTypes.includes(ambientType) ? ambientType : state.currentAmbientType;
    state.currentAmbientType = ambient;
    document.querySelectorAll(".ambient-btn").forEach((b) => {
      b.classList.remove("bg-white/20", "text-white", "shadow-sm");
      b.classList.add("text-white/60");
    });
    const active = document.querySelector(`.ambient-btn[data-ambient="${ambient}"]`);
    if (active) {
      active.classList.add("bg-white/20", "text-white", "shadow-sm");
      active.classList.remove("text-white/60");
    }
    if (state.isAudioInitialized) ns.audio.switchAmbientNoise(ambient);
  }

  function setAudioControls(audioEnabled, volume) {
    dom.audioToggle.checked = audioEnabled !== false;
    dom.volumeSlider.value = Math.max(0, Math.min(100, parseInt(volume, 10) || 30));
    ns.audio.updateAudioVolume();
  }

  function persistCurrentSettings() {
    const payload = {
      mode: getActiveMode(),
      customDurations: {
        inhale: parseInt(document.getElementById("in-time").value, 10) || 0,
        hold1: parseInt(document.getElementById("hold1-time").value, 10) || 0,
        exhale: parseInt(document.getElementById("out-time").value, 10) || 0,
        hold2: parseInt(document.getElementById("hold2-time").value, 10) || 0,
      },
      timerMode: getActiveTimerMode(),
      customMinutes: parseInt(document.getElementById("custom-minutes").value, 10) || 15,
      ambientType: state.currentAmbientType,
      audioEnabled: dom.audioToggle.checked,
      volume: parseInt(dom.volumeSlider.value, 10) || 30,
    };
    ns.persistence.saveSettings(payload);
    refreshContinueButton();
  }

  function applySettings(settings) {
    if (!settings) return;
    setMode(settings.mode, settings.customDurations);
    setTimerMode(settings.timerMode, settings.customMinutes);
    setAmbient(settings.ambientType);
    setAudioControls(settings.audioEnabled, settings.volume);
    persistCurrentSettings();
  }

  function refreshContinueButton() {
    if (!dom.continueBtn) return;
    const hasLast = !!state.lastSettings;
    dom.continueBtn.disabled = !hasLast;
    dom.continueBtn.classList.toggle("opacity-50", !hasLast);
    dom.continueBtn.classList.toggle("cursor-not-allowed", !hasLast);
  }

  function setupModeButtons() {
    document.querySelectorAll(".mode-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const mode = e.target.dataset.mode;
        setMode(mode, state.durations);
        persistCurrentSettings();
      });
    });

    ["in", "hold1", "out", "hold2"].forEach((type) => {
      document.getElementById(`${type}-time`).addEventListener("change", () => {
        updateCustomDurations();
        persistCurrentSettings();
      });
    });
  }

  function setupTimerButtons() {
    const timerBtns = document.querySelectorAll(".timer-btn");
    timerBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const tValue = e.target.dataset.time;
        setTimerMode(tValue, parseInt(document.getElementById("custom-minutes").value, 10) || 15);
        persistCurrentSettings();
        if (state.isSessionActive) ns.session.toggleSession();
      });
    });

    document.getElementById("custom-minutes").addEventListener("change", (e) => {
      const mins = parseInt(e.target.value, 10) || 15;
      state.endlessMode = false;
      state.remainingSessionTime = mins * 60;
      persistCurrentSettings();
      if (state.isSessionActive) ns.session.toggleSession();
    });
  }

  function setupAmbientButtons() {
    const ambientBtns = document.querySelectorAll(".ambient-btn");
    ambientBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        setAmbient(e.target.dataset.ambient);
        persistCurrentSettings();
      });
    });
  }

  function setupOverlayEvents() {
    dom.settingsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (state.isSessionActive) ns.session.toggleSession();
      if (dom.settingsOverlay.classList.contains("hidden") || dom.settingsOverlay.classList.contains("opacity-0")) {
        openSettingsOverlay();
      } else {
        closeSettingsOverlay();
      }
    });

    dom.startBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeSettingsOverlay();
      persistCurrentSettings();
      if (!state.isSessionActive) ns.session.toggleSession();
    });

    if (dom.continueBtn) {
      dom.continueBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!state.lastSettings) return;
        applySettings(state.lastSettings);
        closeSettingsOverlay();
        if (!state.isSessionActive) ns.session.toggleSession();
      });
    }

    document.addEventListener("click", (e) => {
      if (!dom.settingsPanel.contains(e.target) && !dom.settingsBtn.contains(e.target) && !dom.settingsOverlay.classList.contains("opacity-0")) {
        dom.settingsBtn.click();
      }
    });
  }

  function setupAudioControls() {
    dom.audioToggle.addEventListener("change", () => {
      ns.audio.updateAudioVolume();
      persistCurrentSettings();
    });
    dom.volumeSlider.addEventListener("input", () => {
      ns.audio.updateAudioVolume();
      persistCurrentSettings();
    });
  }

  function initUI() {
    if (state.lastSettings) {
      applySettings(state.lastSettings);
    } else {
      setAudioControls(true, parseInt(dom.volumeSlider.value, 10) || 30);
      persistCurrentSettings();
    }

    setupOverlayEvents();
    setupAudioControls();
    setupModeButtons();
    setupTimerButtons();
    setupAmbientButtons();
    ns.audio.syncAmbientButtons();
    ns.persistence.updateInsightsUI();
    refreshContinueButton();
  }

  ns.ui = {
    initUI,
    updateCustomDurations,
    openSettingsOverlay,
    closeSettingsOverlay,
    persistCurrentSettings,
    applySettings,
  };
})(window.ZenBreath || (window.ZenBreath = {}));
