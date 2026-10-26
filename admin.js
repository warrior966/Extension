document.addEventListener("DOMContentLoaded", () => {
  const isAuthenticated = sessionStorage.getItem("adminAuth");

  if (isAuthenticated === "true") {
    document.getElementById("auth-modal").style.display = "none";
    initAdminPanel();
  } else {
    document.getElementById("verify-pass-btn").addEventListener("click", verifyPassword);
    document.getElementById("admin-pass-input").addEventListener("keypress", (e) => {
      if (e.key === "Enter") verifyPassword();
    });
  }
});

function verifyPassword() {
  const inputPass = document.getElementById("admin-pass-input").value;

  chrome.storage.local.get(["adminPassword"], (data) => {
    const correctPass = data.adminPassword || "1234";

    if (inputPass === correctPass) {
      sessionStorage.setItem("adminAuth", "true");
      document.getElementById("auth-modal").style.display = "none";
      initAdminPanel();
    } else {
      const errorText = document.getElementById("pass-error");
      errorText.style.display = "block";
      document.getElementById("admin-pass-input").value = "";
    }
  });
}

function initAdminPanel() {
  renderAdminPanel();

  document.getElementById("addWebBtn").addEventListener("click", addWeb);
  document.getElementById("toggleDeviceBtn").addEventListener("click", toggleDevice);
  document.getElementById("addUserBtn").addEventListener("click", addUser);
}

function renderAdminPanel() {
  chrome.storage.local.get(["blockedWebs", "deviceStatus", "currentUser", "users"], (data) => {
    const currentUser = data.currentUser || { name: "Anónimo", role: "user" };
    const users = data.users || [];
    const blockedWebs = data.blockedWebs || [];
    const deviceStatus = data.deviceStatus || "allowed";

    document.getElementById("current-user-name").textContent = `${currentUser.name} (${currentUser.role})`;

    const webList = document.getElementById("webList");
    webList.innerHTML = "";
    blockedWebs.forEach((web) => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${web}</span><button class="danger" style="padding: 4px 8px; font-size: 12px;">Desbloquear</button>`;
      li.querySelector("button").onclick = () => removeWeb(web);
      webList.appendChild(li);
    });

    const statusBox = document.getElementById("statusBox");
    const toggleBtn = document.getElementById("toggleDeviceBtn");

    if (deviceStatus === "blocked") {
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

    const userList = document.getElementById("userList");
    userList.innerHTML = "";
    users.forEach((u) => {
      const li = document.createElement("li");
      const roleBadge = u.role === "admin" ? `<span class="badge badge-admin">Admin</span>` : `<span class="badge badge-user">Usuario</span>`;
      li.innerHTML = `<div><strong>${u.name}</strong> ${roleBadge}</div>`;

      if (u.name !== currentUser.name) {
        const delBtn = document.createElement("button");
        delBtn.textContent = "Eliminar";
        delBtn.className = "danger";
        delBtn.style.padding = "4px 8px";
        delBtn.style.fontSize = "12px";
        delBtn.onclick = () => removeUser(u.name);
        li.appendChild(delBtn);
      }
      userList.appendChild(li);
    });
  });
}

function addWeb() {
  const input = document.getElementById("webInput");
  const web = input.value.trim().toLowerCase();
  if (!web) return;
  chrome.storage.local.get(["blockedWebs"], (data) => {
    const blockedWebs = data.blockedWebs || [];
    if (!blockedWebs.includes(web)) {
      blockedWebs.push(web);
      chrome.storage.local.set({ blockedWebs }, () => {
        input.value = "";
        renderAdminPanel();
      });
    }
  });
}

function removeWeb(webToRemove) {
  chrome.storage.local.get(["blockedWebs"], (data) => {
    const blockedWebs = (data.blockedWebs || []).filter(w => w !== webToRemove);
    chrome.storage.local.set({ blockedWebs }, renderAdminPanel);
  });
}

function toggleDevice() {
  chrome.storage.local.get(["deviceStatus"], (data) => {
    const newStatus = data.deviceStatus === "blocked" ? "allowed" : "blocked";
    chrome.storage.local.set({ deviceStatus: newStatus }, renderAdminPanel);
  });
}

function addUser() {
  const nameInput = document.getElementById("userNameInput");
  const roleSelect = document.getElementById("userRoleSelect");
  const name = nameInput.value.trim();
  const role = roleSelect.value;
  if (!name) return;
  chrome.storage.local.get(["users"], (data) => {
    const users = data.users || [];
    if (!users.some(u => u.name === name)) {
      users.push({ name, role });
      chrome.storage.local.set({ users }, () => {
        nameInput.value = "";
        renderAdminPanel();
      });
    }
  });
}

function removeUser(userName) {
  chrome.storage.local.get(["users"], (data) => {
    const users = (data.users || []).filter(u => u.name !== userName);
    chrome.storage.local.set({ users }, renderAdminPanel);
  });
}