document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("verify-pass-btn").addEventListener("click", verifyAndUnlock);
  document.getElementById("admin-pass-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") verifyAndUnlock();
  });
});

async function verifyAndUnlock() {
  const inputPass = document.getElementById("admin-pass-input").value;
  const isValid = await verifyAdminPassword(inputPass);

  if (isValid) {
    document.getElementById("auth-modal").style.display = "none";
    await logEvent("ADMIN_PANEL_ACCESS", "Acceso exitoso al panel web de administración.");
    initAdminPanel();
  } else {
    document.getElementById("pass-error").style.display = "block";
    document.getElementById("admin-pass-input").value = "";
    await logEvent("ADMIN_PANEL_FAIL", "Intento fallido de acceso al panel web.");
  }
}

function initAdminPanel() {
  renderAdminPanel();

  document.getElementById("addWebBtn").addEventListener("click", addWeb);
  document.getElementById("toggleDeviceBtn").addEventListener("click", toggleDevice);
  document.getElementById("addUserBtn").addEventListener("click", addUser);
  document.getElementById("exportBtn").addEventListener("click", handleExport);
  document.getElementById("importBtn").addEventListener("click", () => document.getElementById("importFile").click());
  document.getElementById("importFile").addEventListener("change", handleImport);
}

async function renderAdminPanel() {
  const state = await getStorageData();
  const currentUser = state.currentUser || { name: "Anónimo", role: "user" };

  document.getElementById("current-user-name").textContent = `${currentUser.name} (${currentUser.role})`;

  // 1. Blacklist
  const webList = document.getElementById("webList");
  webList.innerHTML = "";
  state.rules.blacklist.forEach((web) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${web}</span><button class="danger" style="padding: 2px 6px; font-size: 11px;">Quitar</button>`;
    li.querySelector("button").onclick = () => removeWeb(web);
    webList.appendChild(li);
  });

  // 2. Dispositivo
  const statusBox = document.getElementById("statusBox");
  const toggleBtn = document.getElementById("toggleDeviceBtn");
  if (state.deviceStatus === "blocked") {
    statusBox.textContent = "🔒 ESTADO: DISPOSITIVO BLOQUEADO";
    statusBox.className = "status-box status-blocked";
    toggleBtn.textContent = "Desbloquear Dispositivo";
    toggleBtn.className = "success";
  } else {
    statusBox.textContent = "🔓 ESTADO: DISPOSITIVO PERMITIDO";
    statusBox.className = "status-box status-allowed";
    toggleBtn.textContent = "Bloquear Todo el Dispositivo";
    toggleBtn.className = "danger";
  }

  // 3. Usuarios
  const userList = document.getElementById("userList");
  userList.innerHTML = "";
  state.users.forEach((u) => {
    const li = document.createElement("li");
    li.innerHTML = `<div><strong>${u.name}</strong> (${u.role})</div>`;
    if (u.name !== currentUser.name) {
      const delBtn = document.createElement("button");
      delBtn.textContent = "Borrar";
      delBtn.className = "danger";
      delBtn.style.padding = "2px 6px";
      delBtn.style.fontSize = "11px";
      delBtn.onclick = () => removeUser(u.name);
      li.appendChild(delBtn);
    }
    userList.appendChild(li);
  });

  // 4. Logs
  const logList = document.getElementById("logList");
  logList.innerHTML = "";
  (state.logs || []).forEach(log => {
    const div = document.createElement("div");
    div.textContent = `[${log.timestamp.slice(11, 19)}] (${log.user}) ${log.action}: ${log.details}`;
    logList.appendChild(div);
  });
}

async function addWeb() {
  const input = document.getElementById("webInput");
  const domain = normalizeDomain(input.value);
  if (!domain || !isValidDomain(domain)) {
    alert("Dominio no válido.");
    return;
  }

  const state = await getStorageData();
  if (!state.rules.blacklist.includes(domain)) {
    state.rules.blacklist.push(domain);
    await setStorageData(state);
    await logEvent("WEB_BLOCK_ADD", `Dominio añadido a lista negra: ${domain}`);
    input.value = "";
    renderAdminPanel();
  }
}

async function removeWeb(domain) {
  const state = await getStorageData();
  state.rules.blacklist = state.rules.blacklist.filter(w => w !== domain);
  await setStorageData(state);
  await logEvent("WEB_BLOCK_REMOVE", `Dominio retirado de lista negra: ${domain}`);
  renderAdminPanel();
}

async function toggleDevice() {
  const state = await getStorageData();
  state.deviceStatus = state.deviceStatus === "blocked" ? "allowed" : "blocked";
  await setStorageData(state);
  await logEvent("DEVICE_STATUS_CHANGE", `Estado del dispositivo cambiado a: ${state.deviceStatus}`);
  renderAdminPanel();
}

async function addUser() {
  const nameInput = document.getElementById("userNameInput");
  const roleSelect = document.getElementById("userRoleSelect");
  const name = nameInput.value.trim();
  const role = roleSelect.value;
  if (!name) return;

  const state = await getStorageData();
  if (!state.users.some(u => u.name === name)) {
    state.users.push({ name, role });
    await setStorageData(state);
    await logEvent("USER_ADD", `Usuario creado: ${name} (${role})`);
    nameInput.value = "";
    renderAdminPanel();
  }
}

async function removeUser(name) {
  const state = await getStorageData();
  state.users = state.users.filter(u => u.name !== name);
  await setStorageData(state);
  await logEvent("USER_REMOVE", `Usuario eliminado: ${name}`);
  renderAdminPanel();
}

async function handleExport() {
  const url = await exportConfig();
  const a = document.createElement("a");
  a.href = url;
  a.download = `config-seguridad-${Date.now()}.json`;
  a.click();
  await logEvent("CONFIG_EXPORT", "Configuración exportada a JSON.");
}

async function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (event) => {
    const res = await importConfig(event.target.result);
    if (res.success) {
      alert("Configuración importada con éxito.");
      await logEvent("CONFIG_IMPORT", "Configuración importada desde archivo JSON.");
      renderAdminPanel();
    } else {
      alert("Error al importar: " + res.error);
    }
  };
  reader.readAsText(file);
}
