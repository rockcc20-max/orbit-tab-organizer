(() => {
  "use strict";

  const storageKey = "orbitTheme";
  const modes = ["system", "light", "dark"];
  const labels = { system: "跟随浏览器", light: "白天模式", dark: "黑夜模式" };
  const paths = {
    system: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>',
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
  globalThis.addEventListener("storage", (event) => {
    if (event.key !== storageKey && event.key !== null) return;
    try { if (event.storageArea && event.storageArea !== localStorage) return; } catch { return; }
    preference = normalize(event.newValue);
    applyTheme();
  });

  function initializeControls() {
    const control = document.getElementById("theme-control");
    const toggle = document.getElementById("theme-toggle");
    const menu = document.getElementById("theme-menu");
    const label = document.getElementById("theme-label");
    const icon = document.getElementById("theme-icon");
    const options = modes.map((mode) => document.getElementById(`theme-${mode}`));
    if (!control || !toggle || !menu || options.some((option) => !option)) return;

    renderControls = () => {
      label.textContent = labels[preference];
      icon.innerHTML = paths[preference];
      toggle.setAttribute("aria-label", `切换外观，当前：${labels[preference]}`);
      toggle.title = `外观：${labels[preference]}`;
      options.forEach((option, index) => option.setAttribute("aria-checked", String(modes[index] === preference)));
    };
    renderControls();

    function closeMenu(restoreFocus = false) {
      menu.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      if (restoreFocus) toggle.focus();
    }
    function openMenu(index = modes.indexOf(preference)) {
      menu.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
      options[index].focus();
    }
    toggle.addEventListener("click", () => menu.hidden ? openMenu() : closeMenu());
    toggle.addEventListener("keydown", (event) => {
      if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;
      event.preventDefault();
      openMenu(event.key === "ArrowUp" ? options.length - 1 : 0);
    });
    options.forEach((option, index) => option.addEventListener("click", () => {
      preference = modes[index];
      applyTheme();
      try { localStorage.setItem(storageKey, preference); } catch {
        const region = document.getElementById("toast-region");
        if (region) {
          const notice = document.createElement("div");
          notice.className = "toast";
          notice.textContent = "外观已切换，但当前浏览器无法保存设置。";
          region.append(notice);
          setTimeout(() => notice.remove(), 4500);
        }
      }
      closeMenu(true);
    }));
    menu.addEventListener("keydown", (event) => {
      const index = options.indexOf(document.activeElement);
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); closeMenu(true); }
      else if (event.key === "Tab") closeMenu();
      else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        const next = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 :
          (index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
        options[next].focus();
      }
    });
    document.addEventListener("click", (event) => { if (!control.contains(event.target)) closeMenu(); });
    control.addEventListener("focusout", (event) => { if (!control.contains(event.relatedTarget)) closeMenu(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initializeControls, { once: true });
  else initializeControls();
})();
