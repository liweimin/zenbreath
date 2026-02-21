const { test, expect } = require("@playwright/test");
const path = require("path");
const { pathToFileURL } = require("url");

const fileUrl = pathToFileURL(path.resolve(__dirname, "..", "ZenBreath.html")).href;

function captureLogs(page) {
  const logs = [];
  const onConsole = (msg) => logs.push({ type: msg.type(), text: msg.text() });
  const onPageError = (err) => logs.push({ type: "pageerror", text: err.message || String(err) });
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  return {
    logs,
    detach: () => {
      page.off("console", onConsole);
      page.off("pageerror", onPageError);
    },
  };
}

function criticalLogs(logs) {
  return logs.filter((l) => {
    const text = l.text || "";
    if (/cdn\.tailwindcss\.com should not be used in production/i.test(text)) return false;
    if (/favicon/i.test(text)) return false;
    return l.type === "error" || l.type === "pageerror" || /BiquadFilterNode: state is bad/i.test(text);
  });
}

async function getSnapshot(page) {
  return page.evaluate(() => {
    const safe = (fn, fallback = null) => {
      try {
        return fn();
      } catch {
        return fallback;
      }
    };

    return {
      isSessionActive: safe(() => isSessionActive),
      remainingSessionTime: safe(() => remainingSessionTime),
      endlessMode: safe(() => endlessMode),
      durations: safe(() => ({ ...durations })),
      audioCtxState: safe(() => (audioCtx ? audioCtx.state : null)),
      ambientGain: safe(() => (ambientGainNode ? ambientGainNode.gain.value : null)),
      globalTimerText: document.getElementById("global-timer")?.innerText || "",
      statusText: document.getElementById("status-text")?.innerText || "",
      overlayClass: document.getElementById("settings-overlay")?.className || "",
      bg1: document.getElementById("bg-layer-1")?.style.backgroundImage || "",
      bg2: document.getElementById("bg-layer-2")?.style.backgroundImage || "",
      canvasSize: {
        w: document.getElementById("particles")?.width || 0,
        h: document.getElementById("particles")?.height || 0,
      },
      viewportSize: {
        w: window.innerWidth,
        h: window.innerHeight,
      },
    };
  });
}

test.describe.configure({ mode: "serial" });

test("TC-001 页面加载与关键元素可见", async ({ page }) => {
  const watcher = captureLogs(page);
  await page.goto(fileUrl, { waitUntil: "domcontentloaded" });

  await expect(page.locator("#settings-overlay")).toBeVisible();
  await expect(page.locator("#start-btn")).toBeVisible();
  await expect(page.locator("#settings-btn")).toBeVisible();
  await expect(page.locator("#breath-circle")).toBeVisible();

  watcher.detach();
  expect(criticalLogs(watcher.logs)).toEqual([]);
});

test("TC-002 默认配置可启动会话", async ({ page }) => {
  const watcher = captureLogs(page);
  await page.goto(fileUrl, { waitUntil: "domcontentloaded" });

  await page.click("#start-btn");
  await page.waitForTimeout(1200);

  const snap = await getSnapshot(page);
  expect(snap.isSessionActive).toBe(true);
  expect(snap.audioCtxState === "running" || snap.audioCtxState === "suspended").toBeTruthy();
  expect(snap.statusText).not.toBe("起息");

  watcher.detach();
  expect(criticalLogs(watcher.logs)).toEqual([]);
});

test("TC-003 切换五种环境音，链路不崩溃", async ({ page }) => {
  const watcher = captureLogs(page);
  await page.goto(fileUrl, { waitUntil: "domcontentloaded" });
  await page.click("#start-btn");
  await page.waitForTimeout(900);

  await page.click("#settings-btn");
  for (const a of ["earth", "water", "fire", "wind", "void"]) {
    await page.click(`button.ambient-btn[data-ambient="${a}"]`);
    await page.waitForTimeout(250);
  }
  await page.click("#start-btn");
  await page.waitForTimeout(1000);

  const snap = await getSnapshot(page);
  expect(snap.isSessionActive).toBe(true);
  expect(snap.audioCtxState === "running" || snap.audioCtxState === "suspended").toBeTruthy();

  watcher.detach();
  expect(criticalLogs(watcher.logs)).toEqual([]);
});

test("TC-004 音频开关与音量调整有效", async ({ page }) => {
  const watcher = captureLogs(page);
  await page.goto(fileUrl, { waitUntil: "domcontentloaded" });
  await page.click("#start-btn");
  await page.waitForTimeout(800);

  await page.evaluate(() => {
    document.getElementById("volume-slider").value = "80";
    document.getElementById("audio-toggle").checked = false;
    updateAudioVolume();
  });
  await page.waitForTimeout(800);
  const offSnap = await getSnapshot(page);

  await page.evaluate(() => {
    document.getElementById("audio-toggle").checked = true;
    updateAudioVolume();
  });
  await page.waitForTimeout(1200);
  const onSnap = await getSnapshot(page);

  expect(offSnap.ambientGain).not.toBeNull();
  expect(onSnap.ambientGain).not.toBeNull();
  expect(offSnap.ambientGain).toBeLessThan(0.02);
  expect(onSnap.ambientGain).toBeGreaterThan(0.02);

  watcher.detach();
  expect(criticalLogs(watcher.logs)).toEqual([]);
});

test("TC-005 自定义四段全 0 时自动纠正并保持会话可运行", async ({ page }) => {
  const watcher = captureLogs(page);
  await page.goto(fileUrl, { waitUntil: "domcontentloaded" });

  await page.click('button.mode-btn[data-mode="custom"]');
  await page.fill("#in-time", "0");
  await page.fill("#hold1-time", "0");
  await page.fill("#out-time", "0");
  await page.fill("#hold2-time", "0");
  await page.dispatchEvent("#in-time", "change");
  await page.dispatchEvent("#hold1-time", "change");
  await page.dispatchEvent("#out-time", "change");
  await page.dispatchEvent("#hold2-time", "change");

  await page.click("#start-btn");
  await page.waitForTimeout(1200);

  const snap = await getSnapshot(page);
  expect(snap.isSessionActive).toBe(true);
  expect(snap.durations.inhale).toBe(4);

  watcher.detach();
  expect(criticalLogs(watcher.logs)).toEqual([]);
});

test("TC-006 固定时长会话可自动结束", async ({ page }) => {
  const watcher = captureLogs(page);
  await page.goto(fileUrl, { waitUntil: "domcontentloaded" });
  await page.click("#start-btn");
  await page.waitForTimeout(1000);

  await page.evaluate(() => {
    endlessMode = false;
    remainingSessionTime = 3;
  });
  await page.waitForTimeout(7000);

  const snap = await getSnapshot(page);
  expect(snap.isSessionActive).toBe(false);

  watcher.detach();
  expect(criticalLogs(watcher.logs)).toEqual([]);
});

test("TC-007 无尽模式会话保持运行", async ({ page }) => {
  const watcher = captureLogs(page);
  await page.goto(fileUrl, { waitUntil: "domcontentloaded" });
  await page.click('button.timer-btn[data-time="0"]');
  await page.click("#start-btn");
  await page.waitForTimeout(5000);

  const snap = await getSnapshot(page);
  expect(snap.endlessMode).toBe(true);
  expect(snap.isSessionActive).toBe(true);
  expect(snap.globalTimerText).toContain("深 空 无 尽");

  watcher.detach();
  expect(criticalLogs(watcher.logs)).toEqual([]);
});

test("TC-008 呼吸模式切换正确更新参数", async ({ page }) => {
  const watcher = captureLogs(page);
  await page.goto(fileUrl, { waitUntil: "domcontentloaded" });

  await page.click('button.mode-btn[data-mode="4-7-8-0"]');
  let snap = await getSnapshot(page);
  expect(snap.durations).toEqual({ inhale: 4, hold1: 7, exhale: 8, hold2: 0 });

  await page.click('button.mode-btn[data-mode="5-0-5-0"]');
  snap = await getSnapshot(page);
  expect(snap.durations).toEqual({ inhale: 5, hold1: 0, exhale: 5, hold2: 0 });

  await page.click('button.mode-btn[data-mode="custom"]');
  await page.fill("#in-time", "2");
  await page.fill("#hold1-time", "1");
  await page.fill("#out-time", "3");
  await page.fill("#hold2-time", "1");
  await page.dispatchEvent("#in-time", "change");
  await page.dispatchEvent("#hold1-time", "change");
  await page.dispatchEvent("#out-time", "change");
  await page.dispatchEvent("#hold2-time", "change");

  snap = await getSnapshot(page);
  expect(snap.durations).toEqual({ inhale: 2, hold1: 1, exhale: 3, hold2: 1 });

  watcher.detach();
  expect(criticalLogs(watcher.logs)).toEqual([]);
});

test("TC-009 设置面板可通过外部点击关闭并可重新打开", async ({ page }) => {
  const watcher = captureLogs(page);
  await page.goto(fileUrl, { waitUntil: "domcontentloaded" });

  await expect(page.locator("#settings-overlay")).toBeVisible();
  await page.mouse.click(8, 8);
  await page.waitForTimeout(500);

  let snap = await getSnapshot(page);
  expect(snap.overlayClass.includes("opacity-0") || snap.overlayClass.includes("hidden")).toBeTruthy();

  await page.click("#settings-btn");
  await page.waitForTimeout(400);
  snap = await getSnapshot(page);
  expect(snap.overlayClass.includes("opacity-100")).toBeTruthy();

  watcher.detach();
  expect(criticalLogs(watcher.logs)).toEqual([]);
});

test("TC-010 高频切换环境音 30 次不应触发 bad state", async ({ page }) => {
  const watcher = captureLogs(page);
  await page.goto(fileUrl, { waitUntil: "domcontentloaded" });
  await page.click("#start-btn");
  await page.waitForTimeout(800);
  await page.click("#settings-btn");

  const ambients = ["earth", "water", "fire", "wind", "void"];
  for (let i = 0; i < 30; i++) {
    const a = ambients[i % ambients.length];
    await page.click(`button.ambient-btn[data-ambient="${a}"]`);
    await page.waitForTimeout(80);
  }

  await page.click("#start-btn");
  await page.waitForTimeout(1200);

  const snap = await getSnapshot(page);
  expect(snap.isSessionActive).toBe(true);

  watcher.detach();
  expect(criticalLogs(watcher.logs)).toEqual([]);
});

test("TC-011 各阶段提示音调用不抛错", async ({ page }) => {
  const watcher = captureLogs(page);
  await page.goto(fileUrl, { waitUntil: "domcontentloaded" });
  await page.click("#start-btn");
  await page.waitForTimeout(800);

  const chimeResult = await page.evaluate(() => {
    try {
      playChime("inhale");
      playChime("exhale");
      playChime("hold1");
      playChime("hold2");
      return true;
    } catch {
      return false;
    }
  });
  expect(chimeResult).toBe(true);

  await page.waitForTimeout(800);
  watcher.detach();
  expect(criticalLogs(watcher.logs)).toEqual([]);
});

test("TC-012 背景图失败时能降级为渐变背景", async ({ page }) => {
  const watcher = captureLogs(page);
  await page.route("https://images.unsplash.com/**", (route) => route.abort());
  await page.goto(fileUrl, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);

  await page.evaluate(() => cycleBackgroundAndQuote());
  await page.waitForTimeout(1300);

  const snap = await getSnapshot(page);
  const merged = `${snap.bg1} ${snap.bg2}`;
  expect(merged.includes("gradient")).toBeTruthy();

  watcher.detach();
  const critical = criticalLogs(watcher.logs).filter(
    (l) => !/Failed to load resource: net::ERR_FAILED/i.test(l.text || "")
  );
  expect(critical).toEqual([]);
});

test("TC-013 Resize 后粒子画布尺寸保持一致", async ({ page }) => {
  const watcher = captureLogs(page);
  await page.goto(fileUrl, { waitUntil: "domcontentloaded" });

  await page.setViewportSize({ width: 980, height: 640 });
  await page.waitForTimeout(300);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.waitForTimeout(300);

  const snap = await getSnapshot(page);
  expect(snap.canvasSize.w).toBe(snap.viewportSize.w);
  expect(snap.canvasSize.h).toBe(snap.viewportSize.h);

  watcher.detach();
  expect(criticalLogs(watcher.logs)).toEqual([]);
});
