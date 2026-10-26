function normalizeDomain(input) {
  if (!input) return "";
  let clean = input.trim().toLowerCase();
  clean = clean.replace(/^https?:\/\//, "");
  clean = clean.replace(/^www\./, "");
  clean = clean.split("/")[0]; // solo el dominio o subdominio base
  return clean;
}

function isValidDomain(domain) {
  const regex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/;
  return regex.test(domain) || domain.includes("localhost");
}

async function updateDynamicRules() {
  const state = await getStorageData();
  
  // Obtener reglas actuales dinámicas registradas para borrarlas
  const oldRules = await chrome.declarativeNetRequest.getDynamicRules();
  const oldRuleIds = oldRules.map(r => r.id);

  const newRules = [];
  let idCounter = 1;

  // Si el dispositivo entero está bloqueado
  if (state.deviceStatus === "blocked") {
    newRules.push({
      id: idCounter++,
      priority: 1,
      action: { type: "redirect", redirect: { extensionPath: "/blocked.html?reason=device" } },
      condition: { urlFilter: "*", resourceTypes: ["main_frame"] }
    });
  } else {
    // Bloqueo de Blacklist
    state.rules.blacklist.forEach((domain) => {
      if (domain) {
        newRules.push({
          id: idCounter++,
          priority: 2,
          action: { type: "redirect", redirect: { extensionPath: `/blocked.html?reason=web&url=${encodeURIComponent(domain)}` } },
          condition: { urlFilter: `*://${domain}/*`, resourceTypes: ["main_frame"] }
        });
        // Bloquear también con subdominios wildcard
        newRules.push({
          id: idCounter++,
          priority: 2,
          action: { type: "redirect", redirect: { extensionPath: `/blocked.html?reason=web&url=${encodeURIComponent(domain)}` } },
          condition: { urlFilter: `*://*.${domain}/*`, resourceTypes: ["main_frame"] }
        });
      }
    });
  }

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: oldRuleIds,
    addRules: newRules
  });
}
