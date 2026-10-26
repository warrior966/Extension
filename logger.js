async function logEvent(action, details) {
  const state = await getStorageData();
  const logs = state.logs || [];
  
  const newLog = {
    timestamp: new Date().toISOString(),
    user: state.currentUser?.name || "Desconocido",
    action,
    details
  };

  logs.unshift(newLog); // Añadir al inicio
  if (logs.length > 100) logs.pop(); // Mantener un límite de 100 logs

  state.logs = logs;
  await setStorageData(state);
}
