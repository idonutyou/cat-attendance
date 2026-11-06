// CAT v236: optional on-device lifecycle log. No network transmission.
(() => {
  const KEY = 'cat-diagnostic-log-v236';
  const ENABLE = 'cat-diagnostic-enabled-v236';
  try {
    if (new URLSearchParams(location.search).get('catDiag') === '1') {
      localStorage.setItem(ENABLE, '1');
    }
  } catch {}
  const enabled = localStorage.getItem(ENABLE) === '1';
  let entries = [];
  try { entries = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch {}
  if (!Array.isArray(entries)) entries = [];
  const write = (event, detail = '') => {
    if (!enabled) return;
    entries.push([new Date().toLocaleTimeString('ko-KR'), String(event), String(detail).slice(0, 45)]);
    entries = entries.slice(-65);
    try { localStorage.setItem(KEY, JSON.stringify(entries)); } catch {}
  };
  window.CAT_DIAG = write;
  if (!enabled) return;
  write('BOOT v236', performance.getEntriesByType('navigation')[0]?.type || 'navigation');
  ['pagehide', 'pageshow', 'beforeunload', 'popstate', 'focus', 'blur'].forEach((event) =>
    window.addEventListener(event, () => write(event))
  );
  document.addEventListener('visibilitychange', () => write('visibility', document.visibilityState));
  const addPanel = () => {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = 'CAT 진단 v236';
    button.style.cssText = 'position:fixed;z-index:2147483647;bottom:12px;left:10px;padding:8px;background:white;color:black;';
    const text = document.createElement('pre');
    text.style.cssText = 'position:fixed;z-index:2147483647;bottom:55px;left:4px;right:4px;max-height:60vh;overflow:auto;background:white;color:black;white-space:pre-wrap;padding:8px;font:11px monospace;';
    text.hidden = true;
    button.addEventListener('click', () => { text.textContent = entries.map((e) => e.join(' | ')).join('\n'); text.hidden = !text.hidden; });
    document.body.append(button, text);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addPanel, { once:true });
  else addPanel();
})();
