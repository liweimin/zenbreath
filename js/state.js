(function bootstrapState(ns) {
  const ambientTypes = ["earth", "water", "fire", "wind", "void"];
  const STORAGE_KEYS = {
    settings: "zenbreath:lastSettings",
    metrics: "zenbreath:dailyMetrics",
  };

  function todayKey() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

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
    ambientFilterNode: null,
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
    sessionStartedAt: 0,
    lastSettings: null,
    metrics: {
      date: todayKey(),
      sessions: 0,
      totalSeconds: 0,
    },
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
    dom.continueBtn = document.getElementById("continue-last-btn");
    dom.audioToggle = document.getElementById("audio-toggle");
    dom.volumeSlider = document.getElementById("volume-slider");
    dom.insightsText = document.getElementById("insights-text");
  };

  function loadJSON(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function saveJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {}
  }

  function sanitizeSettings(settings) {
    if (!settings || typeof settings !== "object") return null;
    const mode = typeof settings.mode === "string" ? settings.mode : "4-4-4-4";
    const customDurations = settings.customDurations && typeof settings.customDurations === "object"
      ? {
          inhale: Math.max(0, parseInt(settings.customDurations.inhale, 10) || 0),
          hold1: Math.max(0, parseInt(settings.customDurations.hold1, 10) || 0),
          exhale: Math.max(0, parseInt(settings.customDurations.exhale, 10) || 0),
          hold2: Math.max(0, parseInt(settings.customDurations.hold2, 10) || 0),
        }
      : { inhale: 4, hold1: 4, exhale: 4, hold2: 4 };
    const timerMode = typeof settings.timerMode === "string" ? settings.timerMode : "5";
    const customMinutes = Math.max(1, Math.min(120, parseInt(settings.customMinutes, 10) || 15));
    const ambientType = ambientTypes.includes(settings.ambientType) ? settings.ambientType : ns.state.currentAmbientType;
    const audioEnabled = settings.audioEnabled !== false;
    const volume = Math.max(0, Math.min(100, parseInt(settings.volume, 10) || 30));

    return { mode, customDurations, timerMode, customMinutes, ambientType, audioEnabled, volume };
  }

  function ensureMetricsCurrentDay() {
    const key = todayKey();
    if (ns.state.metrics.date !== key) {
      ns.state.metrics = { date: key, sessions: 0, totalSeconds: 0 };
      saveJSON(STORAGE_KEYS.metrics, ns.state.metrics);
    }
  }

  function updateInsightsUI() {
    ensureMetricsCurrentDay();
    if (!ns.dom.insightsText) return;
    const minutes = Math.floor(ns.state.metrics.totalSeconds / 60);
    ns.dom.insightsText.innerText = `今 日 ${ns.state.metrics.sessions} 次 · ${minutes} 分`;
  }

  function recordSessionMetrics(seconds) {
    ensureMetricsCurrentDay();
    const s = Math.max(0, Math.floor(seconds || 0));
    if (s <= 0) return;
    ns.state.metrics.sessions += 1;
    ns.state.metrics.totalSeconds += s;
    saveJSON(STORAGE_KEYS.metrics, ns.state.metrics);
    updateInsightsUI();
  }

  function loadPersisted() {
    const loadedSettings = sanitizeSettings(loadJSON(STORAGE_KEYS.settings));
    if (loadedSettings) ns.state.lastSettings = loadedSettings;

    const loadedMetrics = loadJSON(STORAGE_KEYS.metrics);
    if (loadedMetrics && typeof loadedMetrics === "object") {
      ns.state.metrics = {
        date: typeof loadedMetrics.date === "string" ? loadedMetrics.date : todayKey(),
        sessions: Math.max(0, parseInt(loadedMetrics.sessions, 10) || 0),
        totalSeconds: Math.max(0, parseInt(loadedMetrics.totalSeconds, 10) || 0),
      };
    }
    ensureMetricsCurrentDay();
    updateInsightsUI();
  }

  function saveSettings(settings) {
    const sanitized = sanitizeSettings(settings);
    if (!sanitized) return;
    ns.state.lastSettings = sanitized;
    saveJSON(STORAGE_KEYS.settings, sanitized);
  }

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
          insights: {
            sessionsToday: state.metrics.sessions,
            totalMinutesToday: Math.floor(state.metrics.totalSeconds / 60),
          },
          saved: {
            hasLastSettings: !!state.lastSettings,
          },
        };
      },
    });
  };

  ns.persistence = {
    loadPersisted,
    saveSettings,
    recordSessionMetrics,
    updateInsightsUI,
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
