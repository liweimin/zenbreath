(function bootstrapVisual(ns) {
  const state = ns.state;
  const dom = ns.dom;

  const QUOTES = [
    "吸气，我平静身心；呼气，我微笑。 —— 一行禅师",
    "你不是你的想法，你是观察想法的那份觉知。 —— 迈克·辛格",
    "放松，释放，让生命自由流淌。 —— 迈克·辛格",
    "呼吸是连接生命与意识的桥梁。 —— 一行禅师",
    "真正的自由，是内心的宁静与辽阔。 —— 迈克·辛格",
    "每一次呼吸，都是重生的奇迹。 —— 一行禅师",
    "让一切如其所是，你就自由了。 —— 迈克·辛格",
    "安住当下，便可接触到生命的广阔。 —— 一行禅师",
    "如果你想获得平静，就必须停止在头脑中挣扎。 —— 迈克·辛格",
    "专注这一刻，因为只有这一刻是真实的。 —— 一行禅师",
  ];

  const BACKGROUNDS = [
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1470071131384-001b85755b36?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1426604966848-d7adac402bff?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?q=80&w=1920&auto=format&fit=crop",
  ];

  function initBackground() {
    BACKGROUNDS.sort(() => Math.random() - 0.5);
    const layer1 = document.getElementById("bg-layer-1");
    const img = new Image();
    img.onload = () => {
      layer1.style.backgroundImage = `url('${BACKGROUNDS[0]}')`;
    };
    img.onerror = () => {
      layer1.style.backgroundImage = "radial-gradient(circle at 50% 100%, #2b4131 0%, #050f09 100%)";
    };
    img.src = BACKGROUNDS[0];
  }

  function cycleBackgroundAndQuote() {
    state.currentBgIdx = (state.currentBgIdx + 1) % BACKGROUNDS.length;
    const nextLayerNum = state.activeBgLayer === 1 ? 2 : 1;
    const currentLayerEl = document.getElementById(`bg-layer-${state.activeBgLayer}`);
    const nextLayerEl = document.getElementById(`bg-layer-${nextLayerNum}`);

    const img = new Image();
    const fallbackColors = [
      "radial-gradient(circle at 10% 20%, #2f453a 0%, #08110c 100%)",
      "radial-gradient(circle at 80% 80%, #1e3a47 0%, #050d12 100%)",
      "radial-gradient(circle at 50% -20%, #303728 0%, #0a0b08 100%)",
    ];
    const fallbackBg = fallbackColors[state.currentBgIdx % fallbackColors.length];

    img.onload = () => {
      nextLayerEl.style.backgroundImage = `url('${BACKGROUNDS[state.currentBgIdx]}')`;
      nextLayerEl.classList.add("active");
      currentLayerEl.classList.remove("active");
      state.activeBgLayer = nextLayerNum;
    };
    img.onerror = () => {
      nextLayerEl.style.backgroundImage = fallbackBg;
      nextLayerEl.classList.add("active");
      currentLayerEl.classList.remove("active");
      state.activeBgLayer = nextLayerNum;
    };
    img.src = BACKGROUNDS[state.currentBgIdx];

    let quoteIdx;
    do {
      quoteIdx = Math.floor(Math.random() * QUOTES.length);
    } while (quoteIdx === state.lastQuoteIdx);
    state.lastQuoteIdx = quoteIdx;

    dom.quoteText.style.opacity = 0;
    dom.quoteText.style.transform = "translateY(8px)";
    setTimeout(() => {
      dom.quoteText.innerText = QUOTES[quoteIdx];
      dom.quoteText.style.opacity = 0.95;
      dom.quoteText.style.transform = "translateY(0)";
    }, 1000);
  }

  function resizeCanvas() {
    dom.canvas.width = window.innerWidth;
    dom.canvas.height = window.innerHeight;
  }

  class Particle {
    constructor() {
      this.x = Math.random() * dom.canvas.width;
      this.y = Math.random() * dom.canvas.height;
      this.size = Math.random() * 2 + 0.5;
      this.speedX = Math.random() * 0.4 - 0.2;
      this.speedY = Math.random() * -0.6 - 0.1;
      this.opacity = Math.random() * 0.6;
    }

    update() {
      const centerX = dom.canvas.width / 2;
      const centerY = dom.canvas.height / 2;

      if (state.particleMode === "attract") {
        const dx = centerX - this.x;
        const dy = centerY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 20) {
          this.x += (dx / dist) * 2.8;
          this.y += (dy / dist) * 2.8;
        } else {
          this.x = Math.random() > 0.5 ? Math.random() * dom.canvas.width : (Math.random() > 0.5 ? 0 : dom.canvas.width);
          this.y = Math.random() > 0.5 ? Math.random() * dom.canvas.height : (Math.random() > 0.5 ? 0 : dom.canvas.height);
        }
      } else if (state.particleMode === "repel") {
        const dx = this.x - centerX;
        const dy = this.y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < dom.canvas.height * 1.5) {
          this.x += (dx / Math.max(dist, 1)) * 4.5;
          this.y += (dy / Math.max(dist, 1)) * 4.5;
        } else {
          this.x = centerX + (Math.random() - 0.5) * 150;
          this.y = centerY + (Math.random() - 0.5) * 150;
        }
      } else if (state.particleMode === "scatterWait") {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedX *= 0.98;
        this.speedY *= 0.98;
        if (this.y < 0) {
          this.y = dom.canvas.height;
          this.x = Math.random() * dom.canvas.width;
        }
        if (this.y > dom.canvas.height) {
          this.y = 0;
          this.x = Math.random() * dom.canvas.width;
        }
        if (this.x < 0) {
          this.x = dom.canvas.width;
          this.y = Math.random() * dom.canvas.height;
        }
        if (this.x > dom.canvas.width) {
          this.x = 0;
          this.y = Math.random() * dom.canvas.height;
        }
      } else {
        this.x += this.speedX * 0.3;
        this.y += this.speedY * 0.3;
        if (this.y < 0) {
          this.y = dom.canvas.height;
          this.x = Math.random() * dom.canvas.width;
        }
        if (this.y > dom.canvas.height) {
          this.y = 0;
          this.x = Math.random() * dom.canvas.width;
        }
        if (this.x < 0) {
          this.x = dom.canvas.width;
          this.y = Math.random() * dom.canvas.height;
        }
        if (this.x > dom.canvas.width) {
          this.x = 0;
          this.y = Math.random() * dom.canvas.height;
        }
      }
    }

    draw() {
      dom.ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
      dom.ctx.beginPath();
      dom.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      dom.ctx.fill();
    }
  }

  function initParticles() {
    state.particlesArray = [];
    for (let i = 0; i < 200; i++) {
      state.particlesArray.push(new Particle());
    }
  }

  function triggerParticlesScatter(type) {
    const centerX = dom.canvas.width / 2;
    const centerY = dom.canvas.height / 2;

    state.particlesArray.forEach((p) => {
      const angle = Math.random() * Math.PI * 2;
      if (type === "hold1") {
        const radius = 110 * 2.4 + (Math.random() * 40 - 20);
        p.x = centerX + Math.cos(angle) * radius;
        p.y = centerY + Math.sin(angle) * radius;
        p.speedX = Math.cos(angle) * (Math.random() * 8 + 3);
        p.speedY = Math.sin(angle) * (Math.random() * 8 + 3);
      } else if (type === "hold2") {
        const radius = Math.random() * 20;
        p.x = centerX + Math.cos(angle) * radius;
        p.y = centerY + Math.sin(angle) * radius;
        p.speedX = Math.cos(angle) * (Math.random() * 8 + 3);
        p.speedY = Math.sin(angle) * (Math.random() * 8 + 3);
      }
    });
  }

  function animateParticles() {
    dom.ctx.clearRect(0, 0, dom.canvas.width, dom.canvas.height);
    state.particlesArray.forEach((particle) => {
      particle.update();
      particle.draw();
    });
    requestAnimationFrame(animateParticles);
  }

  function initVisual() {
    initBackground();
    resizeCanvas();
    initParticles();
    animateParticles();
    window.addEventListener("resize", resizeCanvas);
  }

  ns.visual = {
    initVisual,
    cycleBackgroundAndQuote,
    triggerParticlesScatter,
    resizeCanvas,
  };

  // Keep compatibility with existing tests/tools.
  window.cycleBackgroundAndQuote = cycleBackgroundAndQuote;
})(window.ZenBreath || (window.ZenBreath = {}));
