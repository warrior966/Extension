document.addEventListener("DOMContentLoaded", () => {
  loadPopup();

  document.getElementById("userSelect").addEventListener("change", (e) => {
    const selectedName = e.target.value;
    chrome.storage.local.get(["users", "adminPassword"], (data) => {
      const targetUser = data.users.find(u => u.name === selectedName);

      if (targetUser && targetUser.role === "admin") {
        const passwordInput = prompt("Introduce la contraseña de Administrador:");
        if (passwordInput !== (data.adminPassword || "1234")) {
          alert("Contraseña incorrecta");
          loadPopup();
          return;
        }
      }

      if (targetUser) {
        chrome.storage.local.set({ currentUser: targetUser }, loadPopup);
      }
    });
  });

  document.getElementById("openAdminBtn").addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("admin.html") });
  });
});

function loadPopup() {
  chrome.storage.local.get(["currentUser", "users"], (data) => {
    const currentUser = data.currentUser || { name: "Admin", role: "admin" };
    const users = data.users || [];

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
  });
}