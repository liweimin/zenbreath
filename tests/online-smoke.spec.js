const { test, expect } = require("@playwright/test");

const targetUrl = process.env.TARGET_URL || "https://zenbreath-wheat.vercel.app/";

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

async function snapshot(page) {
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
      audioCtxState: safe(() => (audioCtx ? audioCtx.state : null)),
      ambientGain: safe(() => (ambientGainNode ? ambientGainNode.gain.value : null)),
      statusText: document.getElementById("status-text")?.innerText || "",
      globalTimerText: document.getElementById("global-timer")?.innerText || "",
      qa: safe(() => window.__qa__, null),
    };
  });
}

test("ONLINE-SMOKE 生产站点关键链路可用", async ({ page }) => {
  test.setTimeout(120_000);
  const watcher = captureLogs(page);

  await page.goto(targetUrl, { waitUntil: "domcontentloaded" });

  await expect(page.locator("#settings-overlay")).toBeVisible();
  await expect(page.locator("#start-btn")).toBeVisible();
  await expect(page.locator("#settings-btn")).toBeVisible();

  await page.click("#start-btn");
  await page.waitForTimeout(1200);

  let snap = await snapshot(page);
  expect(snap.isSessionActive).toBe(true);
  expect(snap.statusText).not.toBe("起息");
  expect(snap.audioCtxState === "running" || snap.audioCtxState === "suspended").toBeTruthy();
  expect(snap.qa).not.toBeNull();
  expect(snap.qa.session.active).toBe(true);

  // 会话中直接切换环境音链路，避免打开设置面板导致自动暂停会话
  await page.evaluate(() => {
    const types = ["earth", "water", "fire", "wind", "void"];
    types.forEach((t) => {
      currentAmbientType = t;
      if (isAudioInitialized) switchAmbientNoise(t);
    });
  });
  await page.waitForTimeout(500);

  // 音频开关/音量联动
  await page.evaluate(async () => {
    if (audioCtx && audioCtx.state === "suspended") await audioCtx.resume();
    document.getElementById("volume-slider").value = "70";
    document.getElementById("audio-toggle").checked = false;
    updateAudioVolume();
  });
  await page.waitForTimeout(600);
  const offSnap = await snapshot(page);

  await page.evaluate(async () => {
    if (audioCtx && audioCtx.state === "suspended") await audioCtx.resume();
    document.getElementById("audio-toggle").checked = true;
    updateAudioVolume();
  });
  await page.waitForTimeout(900);
  const onSnap = await snapshot(page);

  expect(offSnap.ambientGain).not.toBeNull();
  expect(onSnap.ambientGain).not.toBeNull();
  expect(offSnap.ambientGain).toBeLessThan(0.03);
  expect(onSnap.ambientGain).toBeGreaterThan(0.02);
  expect(onSnap.qa.audio.ambientType).toBe("void");

  // 保持会话继续运行
  await page.waitForTimeout(1000);
  snap = await snapshot(page);
  expect(snap.isSessionActive).toBe(true);
  expect(snap.globalTimerText.length).toBeGreaterThan(0);
  expect(typeof snap.qa.timers.phaseCountdown).toBe("number");

  watcher.detach();
  expect(criticalLogs(watcher.logs)).toEqual([]);
});
