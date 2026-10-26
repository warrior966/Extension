async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function verifyAdminPassword(inputPassword) {
  const state = await getStorageData();
  const inputHash = await hashPassword(inputPassword);
  
  // Si no hay pass configurada, por defecto usamos hash de "1234"
  const defaultHash = await hashPassword("1234");
  const targetHash = state.adminPasswordHash || defaultHash;

  return inputHash === targetHash;
}

async function setAdminPassword(newPassword) {
  const hash = await hashPassword(newPassword);
  const state = await getStorageData();
  state.adminPasswordHash = hash;
  await setStorageData(state);
}
