/* CAT v239 device-specific native-intent safe mode and local-only diagnostics. */
(() => {
  "use strict";
  const SAFE_KEY = "cat-fold7-native-safe-v239";
  const LOG_KEY = "cat-fold7-device-log-v239";
  const params = new URLSearchParams(window.location.search);
  const explicitMode = params.has("catSafe");
  const diagnostics = params.get("catDiag") === "1";
  const modelPattern = /SM[- ]?F966[A-Z0-9]*/i;
  let enabled = false;
  let log = [];
  try {
    enabled = localStorage.getItem(SAFE_KEY) === "1";
    const parsed = JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
    if (Array.isArray(parsed)) log = parsed.slice(-75);
  } catch {}

  const record = (event, detail = "") => {
    if (!diagnostics && !enabled) return;
    const line = [
      new Date().toISOString(),
      String(event).slice(0, 48),
      String(detail).slice(0, 54)
    ];
    log.push(line);
    log = log.slice(-75);
    try { localStorage.setItem(LOG_KEY, JSON.stringify(log)); } catch {}
  };

  let indicator;
  const updateIndicator = () => {
    if (indicator) indicator.hidden = !enabled;
  };
  const setEnabled = (value, reason) => {
    enabled = !!value;
    try { localStorage.setItem(SAFE_KEY, enabled ? "1" : "0"); } catch {}
    record("safe-mode", reason + ":" + enabled);
    updateIndicator();
  };

  if (explicitMode) {
    setEnabled(params.get("catSafe") === "1", "url");
  } else if (modelPattern.test(navigator.userAgent || "")) {
    setEnabled(true, "user-agent-fold7");
  }

  window.CAT_DEVICE_SAFE = Object.freeze({
    nativeSyncBlocked: () => enabled,
    isEnabled: () => enabled
  });
  window.CAT_DIAG = record;
  record("BOOT-v239", (document.referrer ? "referrer" : "direct") +
    (matchMedia("(display-mode: standalone)").matches ? "/pwa" : "/browser"));
  for (const event of ["pageshow", "pagehide", "beforeunload", "popstate"]) {
    addEventListener(event, () => record(event));
  }
  document.addEventListener("visibilitychange", () =>
    record("visibility", document.visibilityState));
  addEventListener("error", e => record("script-error", e.error?.name || "error"));
  addEventListener("unhandledrejection", e =>
    record("promise-error", e.reason?.name || "rejection"));

  if (!explicitMode && navigator.userAgentData?.getHighEntropyValues) {
    navigator.userAgentData.getHighEntropyValues(["model"]).then(values => {
      if (modelPattern.test(values?.model || "")) {
        setEnabled(true, "browser-model-fold7");
      } else {
        record("model-check", "not-fold7-or-unavailable");
      }
    }).catch(() => record("model-check", "unsupported"));
  }

  const makeButton = (label, onClick) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.style.cssText = "background:#fff;color:#172033;border:1px solid #94a3b8;border-radius:7px;padding:6px 9px;font:12px system-ui;margin:3px;";
    button.addEventListener("click", onClick);
    return button;
  };

  const init = () => {
    indicator = document.createElement("div");
    indicator.textContent = "CAT 폴드7 안전모드";
    indicator.hidden = !enabled;
    indicator.style.cssText =
      "position:fixed;right:6px;bottom:5px;z-index:2147483000;pointer-events:none;" +
      "padding:3px 7px;border-radius:6px;color:white;background:#1d4ed8;font:10px system-ui;";
    document.body.appendChild(indicator);

    if (!diagnostics) return;
    const openButton = makeButton("CAT 진단 v239", () => {
      panel.hidden = !panel.hidden;
      output.textContent = log.map(row => row.join(" | ")).join("\n");
    });
    openButton.style.cssText += "position:fixed;bottom:9px;left:6px;z-index:2147483001;";
    const panel = document.createElement("section");
    panel.hidden = true;
    panel.style.cssText = "position:fixed;left:5px;right:5px;bottom:49px;max-height:68dvh;" +
      "overflow:auto;z-index:2147483001;padding:9px;background:#f8fafc;" +
      "color:#111827;border:1px solid #64748b;border-radius:8px;";
    const info = document.createElement("div");
    info.textContent = "CAT v239 로컬 진단 (계정·근무기록은 수집하지 않음)";
    panel.appendChild(info);
    panel.appendChild(makeButton("로그 복사", async () => {
      const contents = log.map(row => row.join(" | ")).join("\n");
      try { await navigator.clipboard.writeText(contents); }
      catch { window.prompt("로그를 복사하세요", contents); }
    }));
    panel.appendChild(makeButton("닫기", () => { panel.hidden = true; }));
    const output = document.createElement("pre");
    output.style.cssText = "white-space:pre-wrap;max-height:40dvh;overflow:auto;font:11px monospace;";
    panel.appendChild(output);
    document.body.append(openButton, panel);
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {once: true});
  } else {
    init();
  }
})();
