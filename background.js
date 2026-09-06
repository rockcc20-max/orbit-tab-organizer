const MANAGER_URL = chrome.runtime.getURL("manager.html");

async function openOrbit() {
  const existing = await chrome.tabs.query({ url: `${MANAGER_URL}*` });
  const managerTab = existing[0];

  if (managerTab) {
    await chrome.tabs.update(managerTab.id, { active: true });
    const window = await chrome.windows.get(managerTab.windowId);
    await chrome.windows.update(managerTab.windowId, window.state === "minimized"
      ? { focused: true, state: "normal" }
      : { focused: true });
    return;
  }

  await chrome.tabs.create({ url: MANAGER_URL });
}

chrome.action.onClicked.addListener(openOrbit);
chrome.commands.onCommand.addListener((command) => {
  if (command === "open-orbit") openOrbit();
});

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason !== "install") return;

  await chrome.storage.local.set({
    orbitSettings: {
      compact: false,
      onboardingSeen: false
    },
    orbitSnapshots: []
  });
  await openOrbit();
});
