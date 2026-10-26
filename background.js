chrome.runtime.onInstalled.addListener(async () => {
  const state = await getStorageData();
  if (!state.adminPasswordHash) {
    const defaultHash = await hashPassword("1234");
    await setStorageData({ ...state, adminPasswordHash: defaultHash });
  }
  await updateDynamicRules();
  await logEvent("SYSTEM_INIT", "Extensión instalada o actualizada.");
});

// Listener para cambios de almacenamiento en tiempo real
chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName === "local") {
    await updateDynamicRules();
  }
});
