(() => {
  "use strict";

  const storageKey = "orbitTheme";
  const modes = ["system", "light", "dark"];
  const fallbackMessages = {
    "theme.switchToLight": "切换到白天模式",
    "theme.switchToDark": "切换到暗色模式",
    "theme.saveError": "外观已切换，但当前浏览器无法保存设置。"
  };
  function t(key, params = {}) {
    const translated = globalThis.OrbitI18n?.t?.(key, params);
    if (typeof translated === "string" && translated !== key) return translated;
    return (fallbackMessages[key] || key).replace(/\{(\w+)\}/g, (match, name) => params[name] ?? match);
  }
  const paths = {
    light: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
    dark: '<path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z"/>'
  };
  const root = document.documentElement;
  const media = globalThis.matchMedia?.("(prefers-color-scheme: dark)");
  const normalize = (value) => modes.includes(value) ? value : "system";
  let preference = "system";
  let renderControls = () => {};
  try { preference = normalize(localStorage.getItem(storageKey)); } catch { /* Storage may be unavailable in previews. */ }

  function applyTheme() {
    const resolved = preference === "system" ? (media?.matches ? "dark" : "light") : preference;
    root.dataset.theme = resolved;
    root.dataset.themePreference = preference;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", resolved === "dark" ? "#171b1a" : "#f7f8fa");
    renderControls();
  }

  // Run before the stylesheet/body is painted, including a saved manual preference.
  applyTheme();
  media?.addEventListener("change", () => { if (preference === "system") applyTheme(); });
  globalThis.addEventListener("orbit:languagechange", () => renderControls());
  globalThis.addEventListener("storage", (event) => {
    if (event.key !== storageKey && event.key !== null) return;
    try { if (event.storageArea && event.storageArea !== localStorage) return; } catch { return; }
    preference = normalize(event.newValue);
    applyTheme();
  });

  function initializeControls() {
    const toggle = document.getElementById("theme-toggle");
    const icon = document.getElementById("theme-icon");
    if (!toggle || !icon) return;

    renderControls = () => {
      const resolved = root.dataset.theme;
      const nextAction = t(resolved === "dark" ? "theme.switchToLight" : "theme.switchToDark");
      icon.innerHTML = paths[resolved];
      toggle.setAttribute("aria-label", nextAction);
      toggle.title = nextAction;
    };
    renderControls();

    // The native button handles pointer, Enter, and Space activation alike.
    toggle.addEventListener("click", () => {
      preference = root.dataset.theme === "dark" ? "light" : "dark";
      applyTheme();
      try { localStorage.setItem(storageKey, preference); } catch {
        const region = document.getElementById("toast-region");
        if (region) {
          const notice = document.createElement("div");
          notice.className = "toast";
          notice.setAttribute("data-i18n", "theme.saveError");
          notice.textContent = t("theme.saveError");
          region.append(notice);
          setTimeout(() => notice.remove(), 4500);
        }
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initializeControls, { once: true });
  else initializeControls();
})();
