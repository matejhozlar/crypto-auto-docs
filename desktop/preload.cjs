const { contextBridge, ipcRenderer } = require("electron");

function sub(ch, cb) {
  const h = (_e, p) => cb(p);
  ipcRenderer.on(ch, h);
  return () => ipcRenderer.removeListener(ch, h);
}

contextBridge.exposeInMainWorld("api", {
  pickFile: (title) => ipcRenderer.invoke("pick-file", { title }),
  runOnchain: (p) => ipcRenderer.invoke("run-monthly", p),
  runWeekly: (p) => ipcRenderer.invoke("run-weekly", p),

  stopRun: (id) => ipcRenderer.invoke("stop-run", { id }),

  onWeeklyStdout: (cb) => sub("py:weekly:stdout", cb),
  onWeeklyStderr: (cb) => sub("py:weekly:stderr", cb),
  onWeeklyExit: (cb) => sub("py:weekly:exit", cb),
  onOnchainStdout: (cb) => sub("py:monthly:stdout", cb),
  onOnchainStderr: (cb) => sub("py:monthly:stderr", cb),
  onOnchainExit: (cb) => sub("py:monthly:exit", cb),

  onWeeklyStopping: (cb) => sub("py:weekly:stopping", cb),
  onOnchainStopping: (cb) => sub("py:monthly:stopping", cb),

  getSettings: () => ipcRenderer.invoke("settings:get"),
  setSettings: (patch) => ipcRenderer.invoke("settings:set", patch),
});
