(function bootstrapState(ns) {
  const ambientTypes = ["earth", "water", "fire", "wind", "void"];

  ns.state = {
    // Visual state
    currentBgIdx: 0,
    activeBgLayer: 1,
    lastQuoteIdx: -1,
    particlesArray: [],
    particleMode: "idle",

    // Audio state
    audioCtx: null,
    ambientNode: null,
    ambientGainNode: null,
    windModTimer: null,
    isAudioInitialized: false,
    ambientTypes,
    currentAmbientType: ambientTypes[Math.floor(Math.random() * ambientTypes.length)],
    lastAudioError: null,

    // Session state
    isSessionActive: false,
    phaseTimer: null,
    countdownTimer: null,
    remainingSessionTime: 5 * 60,
    endlessMode: false,
    durations: { inhale: 4, hold1: 4, exhale: 4, hold2: 4 },
    currentPhaseId: 0,
    currentPhase: "idle",
    countdownRemaining: 0,
    globalTickerStarted: false,
  };

  ns.dom = {};

  ns.initDomRefs = function initDomRefs() {
    const dom = ns.dom;
    dom.circle = document.getElementById("breath-circle");
    dom.aura1 = document.getElementById("aura-1");
    dom.aura2 = document.getElementById("aura-2");
    dom.statusText = document.getElementById("status-text");
    dom.timerText = document.getElementById("timer-text");
    dom.quoteText = document.getElementById("quote-text");
    dom.startHint = document.getElementById("start-hint");
    dom.globalTimer = document.getElementById("global-timer");
    dom.overlayLayer = document.querySelector(".overlay");
    dom.canvas = document.getElementById("particles");
    dom.ctx = dom.canvas.getContext("2d");
    dom.meditationFigure = document.getElementById("meditation-figure");
    dom.settingsOverlay = document.getElementById("settings-overlay");
    dom.settingsPanel = document.getElementById("settings-panel");
    dom.settingsBtn = document.getElementById("settings-btn");
    dom.startBtn = document.getElementById("start-btn");
    dom.audioToggle = document.getElementById("audio-toggle");
    dom.volumeSlider = document.getElementById("volume-slider");
  };

  ns.exposeLegacyGlobals = function exposeLegacyGlobals() {
    const state = ns.state;

    const map = {
      isSessionActive: "isSessionActive",
      remainingSessionTime: "remainingSessionTime",
      endlessMode: "endlessMode",
      durations: "durations",
      audioCtx: "audioCtx",
      ambientGainNode: "ambientGainNode",
      currentAmbientType: "currentAmbientType",
      isAudioInitialized: "isAudioInitialized",
      particleMode: "particleMode",
    };

    Object.keys(map).forEach((name) => {
      const key = map[name];
      Object.defineProperty(window, name, {
        configurable: true,
        get() {
          return state[key];
        },
        set(value) {
          state[key] = value;
        },
      });
    });

    Object.defineProperty(window, "__qa__", {
      configurable: true,
      get() {
        return {
          session: {
            active: state.isSessionActive,
            currentPhase: state.currentPhase,
            remainingSessionTime: state.remainingSessionTime,
            endlessMode: state.endlessMode,
          },
          audio: {
            ctxState: state.audioCtx ? state.audioCtx.state : null,
            ambientType: state.currentAmbientType,
            gain: state.ambientGainNode ? state.ambientGainNode.gain.value : null,
            lastError: state.lastAudioError,
          },
          timers: {
            phaseCountdown: state.countdownRemaining,
            globalText: ns.dom.globalTimer ? ns.dom.globalTimer.innerText : "",
          },
        };
      },
    });
  };

  window.addEventListener("error", (event) => {
    if (!event || !event.message) return;
    ns.state.lastAudioError = event.message;
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event && event.reason ? String(event.reason) : "unhandledrejection";
    ns.state.lastAudioError = reason;
  });
})(window.ZenBreath || (window.ZenBreath = {}));
