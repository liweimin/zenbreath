(function bootstrapAudio(ns) {
  const state = ns.state;
  const dom = ns.dom;
  let fadingChains = [];

  function syncAmbientButtons() {
    document.querySelectorAll(".ambient-btn").forEach((btn) => {
      if (btn.dataset.ambient === state.currentAmbientType) {
        btn.classList.add("bg-white/20", "text-white", "shadow-sm");
        btn.classList.remove("text-white/60");
      } else {
        btn.classList.remove("bg-white/20", "text-white", "shadow-sm");
        btn.classList.add("text-white/60");
      }
    });
  }

  function initAudio() {
    if (state.isAudioInitialized) return;
    try {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      state.audioCtx = new AudioContextCtor();
      state.isAudioInitialized = true;
      switchAmbientNoise(state.currentAmbientType);
    } catch (e) {
      state.lastAudioError = `Web Audio init failed: ${e && e.message ? e.message : String(e)}`;
      console.warn("Web Audio API not supported", e);
    }
  }

  function safeDisconnectAmbientNodes() {
    clearFadingChains();
    if (state.ambientNode) {
      try {
        state.ambientNode.stop();
      } catch (_) {}
      state.ambientNode.disconnect();
      state.ambientNode = null;
    }
    if (state.windModTimer) {
      clearInterval(state.windModTimer);
      state.windModTimer = null;
    }
    if (state.ambientGainNode) {
      state.ambientGainNode.disconnect();
      state.ambientGainNode = null;
    }
    if (state.ambientFilterNode) {
      state.ambientFilterNode.disconnect();
      state.ambientFilterNode = null;
    }
  }

  function stopAndDisconnectChain(chain) {
    if (!chain) return;
    if (chain.windModTimer) {
      clearInterval(chain.windModTimer);
      chain.windModTimer = null;
    }
    try {
      if (chain.node) chain.node.stop();
    } catch (_) {}
    if (chain.node) chain.node.disconnect();
    if (chain.gainNode) chain.gainNode.disconnect();
    if (chain.filter) chain.filter.disconnect();
  }

  function clearFadingChains() {
    for (const chain of fadingChains) {
      if (chain && chain.disposeTimer) {
        clearTimeout(chain.disposeTimer);
      }
      stopAndDisconnectChain(chain);
    }
    fadingChains = [];
  }

  function fadeOutAndDisposeChain(chain) {
    if (!chain || !state.audioCtx || !chain.node) return null;
    const now = state.audioCtx.currentTime;
    if (chain.windModTimer) clearInterval(chain.windModTimer);
    if (chain.gainNode) {
      chain.gainNode.gain.cancelScheduledValues(now);
      chain.gainNode.gain.setTargetAtTime(0, now, 0.08);
    }
    chain.disposeTimer = setTimeout(() => {
      stopAndDisconnectChain(chain);
    }, 500);
    return chain;
  }

  function switchAmbientNoise(type) {
    if (!state.audioCtx) return;
    state.currentAmbientType = type;

    const oldChain = {
      node: state.ambientNode,
      gainNode: state.ambientGainNode,
      filter: state.ambientFilterNode || null,
      windModTimer: state.windModTimer || null,
    };

    const bufferSize = state.audioCtx.sampleRate * 2;
    const buffer = state.audioCtx.createBuffer(1, bufferSize, state.audioCtx.sampleRate);
    const output = buffer.getChannelData(0);

    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      let sample = 0;

      if (type === "fire") {
        let crackle = 0;
        if (Math.random() > 0.9992) crackle = (Math.random() * 2 - 1) * 0.9;
        else if (Math.random() > 0.99) crackle = (Math.random() * 2 - 1) * 0.25;

        sample = ((lastOut + 0.045 * white) / 1.045) + crackle;
        lastOut = sample * 0.82;
        sample *= 0.95;
      } else if (type === "void") {
        sample = white * 0.15;
        lastOut = 0;
      } else {
        sample = (lastOut + 0.02 * white) / 1.02;
        lastOut = sample;
        sample *= 3.2;
      }

      if (!Number.isFinite(sample)) sample = 0;
      output[i] = Math.max(-1, Math.min(1, sample));
    }

    const nextNode = state.audioCtx.createBufferSource();
    nextNode.buffer = buffer;
    nextNode.loop = true;

    const filter = state.audioCtx.createBiquadFilter();
    let nextWindModTimer = null;
    if (type === "earth") {
      filter.type = "lowpass";
      filter.frequency.value = 140;
    } else if (type === "water") {
      filter.type = "lowpass";
      filter.frequency.value = 550;
    } else if (type === "fire") {
      filter.type = "bandpass";
      filter.frequency.value = 800;
      filter.Q.value = 0.6;
    } else if (type === "wind") {
      filter.type = "lowpass";
      filter.frequency.value = 600;
      const baseFreq = 600;
      const sweep = 120;
      let phase = 0;
      nextWindModTimer = setInterval(() => {
        if (!state.audioCtx) return;
        phase += 0.08;
        const nextFreq = Math.max(120, baseFreq + Math.sin(phase) * sweep);
        filter.frequency.setTargetAtTime(nextFreq, state.audioCtx.currentTime, 0.12);
      }, 80);
    } else if (type === "void") {
      filter.type = "highpass";
      filter.frequency.value = 3500;
    }

    const nextGainNode = state.audioCtx.createGain();
    nextGainNode.gain.value = 0;

    nextNode.connect(filter);
    filter.connect(nextGainNode);
    nextGainNode.connect(state.audioCtx.destination);
    nextNode.start();

    state.ambientNode = nextNode;
    state.ambientGainNode = nextGainNode;
    state.ambientFilterNode = filter;
    state.windModTimer = nextWindModTimer;

    clearFadingChains();
    const fadingChain = fadeOutAndDisposeChain(oldChain);
    if (fadingChain) fadingChains.push(fadingChain);

    updateAudioVolume();
    syncAmbientButtons();
  }

  function updateAudioVolume() {
    if (!state.ambientGainNode || !state.audioCtx) return;

    const isEnabled = dom.audioToggle.checked;
    const volume = parseInt(dom.volumeSlider.value, 10) / 100;
    const now = state.audioCtx.currentTime;

    state.ambientGainNode.gain.cancelScheduledValues(now);

    let vMult = 0.6;
    if (state.currentAmbientType === "earth") vMult = 1.4;
    if (state.currentAmbientType === "fire") vMult = 0.8;
    if (state.currentAmbientType === "wind") vMult = 1.0;
    if (state.currentAmbientType === "void") vMult = 0.4;

    if (isEnabled && state.isSessionActive) {
      state.ambientGainNode.gain.setTargetAtTime(volume * vMult, now, 0.4);
    } else {
      state.ambientGainNode.gain.setTargetAtTime(0, now, 0.2);
    }
  }

  function playChime(phase) {
    if (!state.audioCtx || !dom.audioToggle.checked) return;
    if (state.audioCtx.state === "suspended") {
      state.audioCtx.resume();
    }

    const now = state.audioCtx.currentTime;
    const volumeSlider = parseInt(dom.volumeSlider.value, 10) / 100;

    if (phase === "inhale") {
      const osc = state.audioCtx.createOscillator();
      const gain = state.audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.02);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);

      const maxVol = volumeSlider * 0.8;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(maxVol, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 4);

      osc.connect(gain);
      gain.connect(state.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 4);
      return;
    }

    if (phase === "exhale") {
      const osc = state.audioCtx.createOscillator();
      const gain = state.audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);

      const maxVol = volumeSlider * 1.5;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(maxVol, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 4);

      osc.connect(gain);
      gain.connect(state.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 4);
      return;
    }

    const f = phase === "hold1" ? 432 : 396;
    const osc1 = state.audioCtx.createOscillator();
    const osc2 = state.audioCtx.createOscillator();
    const gain = state.audioCtx.createGain();

    osc1.type = "sine";
    osc2.type = "sine";
    osc1.frequency.value = f;
    osc2.frequency.value = f * 1.006;

    let maxVol = volumeSlider * 0.45;
    if (phase === "hold2") maxVol *= 0.6;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(maxVol, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (phase === "hold2" ? 2.5 : 4.5));

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(state.audioCtx.destination);
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 5);
    osc2.stop(now + 5);
  }

  ns.audio = {
    initAudio,
    switchAmbientNoise,
    updateAudioVolume,
    playChime,
    syncAmbientButtons,
  };

  // Keep compatibility with existing tests/tools.
  window.initAudio = initAudio;
  window.switchAmbientNoise = switchAmbientNoise;
  window.updateAudioVolume = updateAudioVolume;
  window.playChime = playChime;
})(window.ZenBreath || (window.ZenBreath = {}));
