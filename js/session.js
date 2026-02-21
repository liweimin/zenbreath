(function bootstrapSession(ns) {
  const state = ns.state;
  const dom = ns.dom;

  function updateStatusText(text, hide) {
    dom.statusText.style.opacity = 0;
    dom.statusText.style.transform = "translateY(-2px)";
    setTimeout(() => {
      if (!hide) {
        dom.statusText.innerText = text;
        dom.statusText.style.opacity = 0.5;
        dom.statusText.style.transform = "translateY(0)";
      }
    }, 300);
  }

  function preciseCountdownLogic(totalSeconds, hide) {
    clearInterval(state.countdownTimer);
    state.countdownRemaining = totalSeconds;

    if (totalSeconds <= 0) {
      dom.timerText.style.opacity = 0;
      return;
    }

    dom.timerText.style.opacity = hide ? 0 : 0.4;
    dom.timerText.style.transform = "translateY(0) scale(1.05)";
    if (!hide) dom.timerText.innerText = totalSeconds;

    setTimeout(() => {
      if (!hide) dom.timerText.style.transform = "translateY(0) scale(1)";
    }, 150);

    let tick = totalSeconds;
    state.countdownTimer = setInterval(() => {
      tick--;
      state.countdownRemaining = Math.max(0, tick);
      if (tick > 0) {
        if (!hide) {
          dom.timerText.innerText = tick;
          dom.timerText.style.transform = "translateY(0) scale(1.08)";
          setTimeout(() => {
            dom.timerText.style.transform = "translateY(0) scale(1)";
          }, 150);
        }
      } else {
        clearInterval(state.countdownTimer);
      }
    }, 1000);
  }

  function playPhase(phase) {
    if (!state.isSessionActive) return;

    if (!state.endlessMode && state.remainingSessionTime <= 0) {
      endSession();
      return;
    }

    state.currentPhaseId += 1;
    state.currentPhase = phase;
    const myPhaseId = state.currentPhaseId;

    let time = 0;
    let nextPhase = "";
    let text = "";
    let hideUI = false;

    const baseScale = 1;
    const expandedScale = 2.4;
    const expandedAura = 1.6;
    const hold1Scale = 4.0;
    const hold2Scale = 0.2;

    if (phase === "inhale") {
      time = state.durations.inhale;
      nextPhase = state.durations.hold1 > 0 ? "hold1" : (state.durations.exhale > 0 ? "exhale" : (state.durations.hold2 > 0 ? "hold2" : "inhale"));
      text = "吸气";
      state.particleMode = "attract";

      ns.visual.cycleBackgroundAndQuote();

      if (time > 0) {
        ns.audio.playChime("inhale");
        const tStr = `${time}s`;
        dom.circle.style.transitionDuration = tStr;
        dom.aura1.style.transitionDuration = tStr;
        dom.aura2.style.transitionDuration = tStr;
        dom.overlayLayer.style.transitionDuration = tStr;

        dom.circle.style.transform = `scale(${expandedScale})`;
        dom.aura1.style.transform = `scale(${expandedAura})`;
        dom.aura2.style.transform = `scale(${expandedAura * 1.1})`;

        dom.meditationFigure.style.opacity = 1;
        dom.aura1.style.opacity = 0.8;
        dom.aura2.style.opacity = 0.8;
        dom.overlayLayer.style.opacity = 1;

        if (state.durations.hold1 === 0) {
          const climaxTime = Math.min(1.5, Math.max(0.5, time * 0.3));
          setTimeout(() => {
            if (myPhaseId !== state.currentPhaseId || !state.isSessionActive) return;
            const leadStr = `${climaxTime}s`;
            dom.circle.style.transitionDuration = leadStr;
            dom.aura1.style.transitionDuration = leadStr;
            dom.aura2.style.transitionDuration = leadStr;
            dom.overlayLayer.style.transitionDuration = leadStr;

            dom.circle.style.transform = `scale(${hold1Scale})`;
            dom.aura1.style.transform = `scale(${hold1Scale * 1.2})`;
            dom.aura2.style.transform = `scale(${hold1Scale * 1.3})`;

            dom.meditationFigure.style.opacity = 0;
            dom.aura1.style.opacity = 0;
            dom.aura2.style.opacity = 0;
            dom.overlayLayer.style.opacity = 0.2;

            ns.visual.triggerParticlesScatter("hold1");
            dom.timerText.style.opacity = 0;
            dom.statusText.style.opacity = 0;
          }, (time - climaxTime) * 1000);
        }
      }
    } else if (phase === "hold1") {
      time = state.durations.hold1;
      nextPhase = state.durations.exhale > 0 ? "exhale" : (state.durations.hold2 > 0 ? "hold2" : "inhale");
      text = "屏息";
      state.particleMode = "idle";

      if (time > 0) {
        ns.audio.playChime("hold1");
        const tStr = `${time}s`;
        dom.circle.style.transitionDuration = tStr;
        dom.aura1.style.transitionDuration = tStr;
        dom.aura2.style.transitionDuration = tStr;
        dom.overlayLayer.style.transitionDuration = tStr;

        dom.circle.style.transform = `scale(${hold1Scale})`;
        dom.aura1.style.transform = `scale(${hold1Scale * 1.2})`;
        dom.aura2.style.transform = `scale(${hold1Scale * 1.3})`;

        dom.meditationFigure.style.opacity = 0;
        dom.aura1.style.opacity = 0;
        dom.aura2.style.opacity = 0;
        dom.overlayLayer.style.opacity = 0.2;
      }
    } else if (phase === "exhale") {
      time = state.durations.exhale;
      nextPhase = state.durations.hold2 > 0 ? "hold2" : "inhale";
      text = "吐气";
      state.particleMode = "repel";

      if (time > 0) {
        ns.audio.playChime("exhale");
        const tStr = `${time}s`;
        dom.circle.style.transitionDuration = tStr;
        dom.aura1.style.transitionDuration = tStr;
        dom.aura2.style.transitionDuration = tStr;
        dom.overlayLayer.style.transitionDuration = tStr;

        dom.circle.style.transform = `scale(${baseScale})`;
        dom.aura1.style.transform = `scale(${baseScale})`;
        dom.aura2.style.transform = `scale(${baseScale})`;

        dom.meditationFigure.style.opacity = 0.6;
        dom.aura1.style.opacity = 0.15;
        dom.aura2.style.opacity = 0.05;
        dom.overlayLayer.style.opacity = 1;

        if (state.durations.hold2 === 0) {
          const climaxTime = Math.min(1.5, Math.max(0.5, time * 0.3));
          setTimeout(() => {
            if (myPhaseId !== state.currentPhaseId || !state.isSessionActive) return;
            const leadStr = `${climaxTime}s`;
            dom.circle.style.transitionDuration = leadStr;
            dom.aura1.style.transitionDuration = leadStr;
            dom.aura2.style.transitionDuration = leadStr;
            dom.overlayLayer.style.transitionDuration = leadStr;

            dom.circle.style.transform = `scale(${hold2Scale})`;
            dom.aura1.style.transform = `scale(${hold2Scale})`;
            dom.aura2.style.transform = `scale(${hold2Scale})`;

            dom.meditationFigure.style.opacity = 0;
            dom.aura1.style.opacity = 0;
            dom.aura2.style.opacity = 0;
            dom.overlayLayer.style.opacity = 0.2;

            ns.visual.triggerParticlesScatter("hold2");
            dom.timerText.style.opacity = 0;
            dom.statusText.style.opacity = 0;
          }, (time - climaxTime) * 1000);
        }
      }
    } else if (phase === "hold2") {
      time = state.durations.hold2;
      nextPhase = "inhale";
      text = "屏息";
      state.particleMode = "scatterWait";
      hideUI = true;

      if (time > 0) {
        ns.audio.playChime("hold2");
        ns.visual.triggerParticlesScatter("hold2");
        const tStr = `${time}s`;
        dom.circle.style.transitionDuration = tStr;
        dom.aura1.style.transitionDuration = tStr;
        dom.aura2.style.transitionDuration = tStr;
        dom.overlayLayer.style.transitionDuration = tStr;

        dom.circle.style.transform = `scale(${hold2Scale})`;
        dom.aura1.style.transform = `scale(${hold2Scale})`;
        dom.aura2.style.transform = `scale(${hold2Scale})`;

        dom.meditationFigure.style.opacity = 0;
        dom.aura1.style.opacity = 0;
        dom.aura2.style.opacity = 0;
        dom.overlayLayer.style.opacity = 0.2;
      }
    }

    if (time === 0) {
      setTimeout(() => playPhase(nextPhase), 10);
      return;
    }

    updateStatusText(text, hideUI);
    preciseCountdownLogic(time, hideUI);

    state.phaseTimer = setTimeout(() => {
      playPhase(nextPhase);
    }, time * 1000);
  }

  function startGlobalTimer() {
    if (state.globalTickerStarted) return;
    state.globalTickerStarted = true;

    setInterval(() => {
      if (!state.isSessionActive) return;
      if (state.endlessMode) {
        dom.globalTimer.innerText = "深 空 无 尽";
        return;
      }
      if (state.remainingSessionTime > 0) {
        state.remainingSessionTime--;
        const m = Math.floor(state.remainingSessionTime / 60);
        const s = state.remainingSessionTime % 60;
        dom.globalTimer.innerText = `剩 余 ${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
      }
    }, 1000);
  }

  function toggleSession() {
    if (!state.isAudioInitialized) {
      ns.audio.initAudio();
    }
    if (state.audioCtx && state.audioCtx.state === "suspended") {
      state.audioCtx.resume();
    }

    if (state.isSessionActive) {
      const elapsed = state.sessionStartedAt > 0 ? (Date.now() - state.sessionStartedAt) / 1000 : 0;
      state.sessionStartedAt = 0;
      ns.persistence.recordSessionMetrics(elapsed);

      state.isSessionActive = false;
      state.currentPhase = "idle";
      clearTimeout(state.phaseTimer);
      clearInterval(state.countdownTimer);
      state.particleMode = "idle";

      dom.circle.style.transitionDuration = "1.5s";
      dom.aura1.style.transitionDuration = "1.5s";
      dom.aura2.style.transitionDuration = "1.5s";
      dom.circle.style.transform = "scale(1)";
      dom.aura1.style.transform = "scale(1)";
      dom.aura2.style.transform = "scale(1)";
      dom.meditationFigure.style.opacity = 0.6;
      dom.aura1.style.opacity = 0;
      dom.aura2.style.opacity = 0;

      updateStatusText("起息");
      dom.timerText.style.opacity = 0;
      dom.timerText.style.transform = "translateY(8px)";
      dom.startHint.style.opacity = 1;
      dom.globalTimer.style.opacity = 0;
      dom.quoteText.style.opacity = 0;

      ns.audio.updateAudioVolume();
      return;
    }

    if (ns.ui && typeof ns.ui.persistCurrentSettings === "function") {
      ns.ui.persistCurrentSettings();
    }

    state.isSessionActive = true;
    state.sessionStartedAt = Date.now();
    dom.startHint.style.opacity = 0;
    dom.globalTimer.style.opacity = 1;

    if (state.ambientGainNode && state.audioCtx) {
      state.ambientGainNode.gain.setValueAtTime(state.ambientGainNode.gain.value, state.audioCtx.currentTime);
    }
    ns.audio.updateAudioVolume();

    if (!state.endlessMode) {
      const activeBtn = document.querySelector(".timer-btn.bg-white\\/20");
      if (activeBtn) {
        if (activeBtn.dataset.time === "custom") {
          state.remainingSessionTime = parseInt(document.getElementById("custom-minutes").value, 10) * 60;
        } else {
          state.remainingSessionTime = parseInt(activeBtn.dataset.time, 10) * 60;
        }
      }
    }

    playPhase("inhale");
  }

  function endSession() {
    const elapsed = state.sessionStartedAt > 0 ? (Date.now() - state.sessionStartedAt) / 1000 : 0;
    state.sessionStartedAt = 0;
    ns.persistence.recordSessionMetrics(elapsed);

    state.isSessionActive = false;
    state.currentPhase = "idle";
    clearTimeout(state.phaseTimer);
    clearInterval(state.countdownTimer);

    updateStatusText("愿你安住");
    dom.timerText.style.opacity = 0;

    dom.circle.style.transitionDuration = "3s";
    dom.aura1.style.transitionDuration = "3s";
    dom.aura2.style.transitionDuration = "3s";
    dom.circle.style.transform = "scale(1)";
    dom.aura1.style.transform = "scale(1)";
    dom.aura2.style.transform = "scale(1)";
    dom.aura1.style.opacity = 0;
    dom.aura2.style.opacity = 0;

    ns.audio.updateAudioVolume();

    setTimeout(() => {
      dom.quoteText.innerText = "身心合一，寂静欢喜。";
      dom.quoteText.style.opacity = 1;
      dom.quoteText.style.transform = "translateY(0)";
    }, 1500);

    setTimeout(() => {
      updateStatusText("起息");
      dom.startHint.style.opacity = 1;
      dom.quoteText.style.opacity = 0;
    }, 9000);
  }

  function initSession() {
    dom.startHint.innerText = "点 击 设 置 开 始";
    startGlobalTimer();
  }

  ns.session = {
    initSession,
    toggleSession,
    playPhase,
    endSession,
    updateStatusText,
    preciseCountdownLogic,
  };

  // Keep compatibility with existing tests/tools.
  window.toggleSession = toggleSession;
  window.playPhase = playPhase;
  window.endSession = endSession;
})(window.ZenBreath || (window.ZenBreath = {}));
