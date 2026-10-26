// Inicializar datos por defecto al instalar
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["blockedWebs", "deviceStatus", "currentUser", "users", "adminPassword"], (data) => {
    if (!data.blockedWebs) {
      chrome.storage.local.set({ blockedWebs: ["facebook.com", "instagram.com"] });
    }
    if (!data.deviceStatus) {
      chrome.storage.local.set({ deviceStatus: "allowed" });
    }
    if (!data.adminPassword) {
      chrome.storage.local.set({ adminPassword: "14052013" }); // Contraseña por defecto
    }
    if (!data.users) {
      chrome.storage.local.set({
        users: [
          { name: "Admin", role: "admin" },
          { name: "Usuario Estándar", role: "user" }
        ]
      });
    }
    if (!data.currentUser) {
      chrome.storage.local.set({ currentUser: { name: "Admin", role: "admin" } });
    }
  });
});

// Interceptar navegación
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId !== 0) return;
  const url = new URL(details.url);
  const domain = url.hostname.replace("www.", "");

  if (details.url.includes(chrome.runtime.getURL("blocked.html"))) return;

  chrome.storage.local.get(["blockedWebs", "deviceStatus"], (data) => {
    const blockedWebs = data.blockedWebs || [];
    const deviceStatus = data.deviceStatus || "allowed";

    if (deviceStatus === "blocked") {
      const blockedUrl = chrome.runtime.getURL(`blocked.html?reason=device&url=${encodeURIComponent(domain)}`);
      chrome.tabs.update(details.tabId, { url: blockedUrl });
      return;
    }

    const isBlocked = blockedWebs.some(blocked => domain.includes(blocked) && blocked.length > 0);
    if (isBlocked) {
      const blockedUrl = chrome.runtime.getURL(`blocked.html?reason=web&url=${encodeURIComponent(domain)}`);
      chrome.tabs.update(details.tabId, { url: blockedUrl });
    }
  });
});
