(function bootstrapUI(ns) {
  const state = ns.state;
  const dom = ns.dom;

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

  function setupModeButtons() {
    document.querySelectorAll(".mode-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        document.querySelectorAll(".mode-btn").forEach((b) => {
          b.classList.remove("bg-white/20", "border-white/10");
          b.classList.add("bg-white/5", "border-transparent");
        });
        e.target.classList.remove("bg-white/5", "border-transparent");
        e.target.classList.add("bg-white/20", "border-white/10");

        const mode = e.target.dataset.mode;
        const customInputs = document.getElementById("custom-inputs");
        if (mode === "custom") {
          customInputs.classList.remove("hidden");
          customInputs.classList.add("grid");
          updateCustomDurations();
          return;
        }

        customInputs.classList.add("hidden");
        customInputs.classList.remove("grid");
        const parts = mode.split("-");
        state.durations = {
          inhale: Math.max(0, parseInt(parts[0], 10)),
          hold1: Math.max(0, parseInt(parts[1], 10)),
          exhale: Math.max(0, parseInt(parts[2], 10)),
          hold2: Math.max(0, parseInt(parts[3], 10)),
        };
      });
    });

    ["in", "hold1", "out", "hold2"].forEach((type) => {
      document.getElementById(`${type}-time`).addEventListener("change", updateCustomDurations);
    });
  }

  function setupTimerButtons() {
    const timerBtns = document.querySelectorAll(".timer-btn");
    timerBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        timerBtns.forEach((b) => {
          b.classList.remove("bg-white/20", "text-white", "shadow-sm");
          b.classList.add("text-white/60");
        });
        e.target.classList.add("bg-white/20", "text-white", "shadow-sm");
        e.target.classList.remove("text-white/60");

        const tValue = e.target.dataset.time;
        const customTimerInput = document.getElementById("custom-timer-input");

        if (tValue === "custom") {
          customTimerInput.classList.remove("hidden");
          customTimerInput.classList.add("flex");
          const mins = parseInt(document.getElementById("custom-minutes").value, 10) || 15;
          state.endlessMode = false;
          state.remainingSessionTime = mins * 60;
        } else {
          customTimerInput.classList.add("hidden");
          customTimerInput.classList.remove("flex");
          const mins = parseInt(tValue, 10);
          state.endlessMode = mins === 0;
          if (!state.endlessMode) state.remainingSessionTime = mins * 60;
        }

        if (state.isSessionActive) ns.session.toggleSession();
      });
    });

    document.getElementById("custom-minutes").addEventListener("change", (e) => {
      const mins = parseInt(e.target.value, 10) || 15;
      state.endlessMode = false;
      state.remainingSessionTime = mins * 60;
      if (state.isSessionActive) ns.session.toggleSession();
    });
  }

  function setupAmbientButtons() {
    const ambientBtns = document.querySelectorAll(".ambient-btn");
    ambientBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        ambientBtns.forEach((b) => {
          b.classList.remove("bg-white/20", "text-white", "shadow-sm");
          b.classList.add("text-white/60");
        });
        e.target.classList.add("bg-white/20", "text-white", "shadow-sm");
        e.target.classList.remove("text-white/60");

        state.currentAmbientType = e.target.dataset.ambient;
        if (state.isAudioInitialized) ns.audio.switchAmbientNoise(state.currentAmbientType);
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
      if (!state.isSessionActive) ns.session.toggleSession();
    });

    document.addEventListener("click", (e) => {
      if (!dom.settingsPanel.contains(e.target) && !dom.settingsBtn.contains(e.target) && !dom.settingsOverlay.classList.contains("opacity-0")) {
        dom.settingsBtn.click();
      }
    });
  }

  function setupAudioControls() {
    dom.audioToggle.addEventListener("change", ns.audio.updateAudioVolume);
    dom.volumeSlider.addEventListener("input", ns.audio.updateAudioVolume);
  }

  function initUI() {
    setupOverlayEvents();
    setupAudioControls();
    setupModeButtons();
    setupTimerButtons();
    setupAmbientButtons();
    ns.audio.syncAmbientButtons();
  }

  ns.ui = {
    initUI,
    updateCustomDurations,
    openSettingsOverlay,
    closeSettingsOverlay,
  };
})(window.ZenBreath || (window.ZenBreath = {}));
