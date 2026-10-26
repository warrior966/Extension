const DEFAULT_STATE = {
  currentUser: { name: "Admin", role: "admin" },
  users: [
    { name: "Admin", role: "admin" },
    { name: "Usuario Estándar", role: "user" }
  ],
  adminPasswordHash: "", // Se inicializa con hash vacío o por defecto (ej. hash de "1234")
  deviceStatus: "allowed",
  rules: {
    blacklist: ["facebook.com", "instagram.com"],
    whitelist: []
  },
  policies: {
    timeRestrictions: []
  },
  logs: []
};

async function getStorageData() {
  return new Promise((resolve) => {
    chrome.storage.local.get(DEFAULT_STATE, (data) => {
      resolve(data);
    });
  });
}

async function setStorageData(newState) {
  return new Promise((resolve) => {
    chrome.storage.local.set(newState, () => {
      resolve();
    });
  });
}

async function exportConfig() {
  const data = await getStorageData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "json" });
  return URL.createObjectURL(blob);
}

async function importConfig(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    await setStorageData(parsed);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
