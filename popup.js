document.addEventListener("DOMContentLoaded", async () => {
  await loadPopup();

  document.getElementById("userSelect").addEventListener("change", async (e) => {
    const selectedName = e.target.value;
    const state = await getStorageData();
    const targetUser = state.users.find(u => u.name === selectedName);

    if (targetUser && targetUser.role === "admin") {
      const passwordInput = prompt("Introduce la contraseña de Administrador:");
      const isValid = await verifyAdminPassword(passwordInput || "");
      if (!isValid) {
        alert("Contraseña incorrecta");
        await logEvent("ADMIN_AUTH_FAIL", "Intento fallido de cambio a rol admin desde popup.");
        await loadPopup();
        return;
      }
      await logEvent("ADMIN_AUTH_SUCCESS", "Acceso admin concedido desde popup.");
    }

    if (targetUser) {
      state.currentUser = targetUser;
      await setStorageData(state);
      await logEvent("USER_SWITCH", `Cambiado a usuario: ${targetUser.name} (${targetUser.role})`);
      await loadPopup();
    }
  });

  document.getElementById("openAdminBtn").addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("admin.html") });
  });
});

async function loadPopup() {
  const state = await getStorageData();
  const currentUser = state.currentUser || { name: "Admin", role: "admin" };
  const users = state.users || [];

  const userSelect = document.getElementById("userSelect");
  userSelect.innerHTML = "";
  users.forEach((u) => {
    const opt = document.createElement("option");
    opt.value = u.name;
    opt.textContent = `${u.name} (${u.role})`;
    if (u.name === currentUser.name) opt.selected = true;
    userSelect.appendChild(opt);
  });

  const openAdminBtn = document.getElementById("openAdminBtn");
  openAdminBtn.style.display = currentUser.role === "admin" ? "block" : "none";
}
