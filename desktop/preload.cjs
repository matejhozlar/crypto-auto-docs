const { contextBridge, ipcRenderer } = require("electron");

function sub(channel, cb) {
  const handler = (_e, payload) => cb(payload);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
}

contextBridge.exposeInMainWorld("api", {
  pickFile: (title) => ipcRenderer.invoke("pick-file", { title }),
  runOnchain: (p) => ipcRenderer.invoke("run-onchain", p),
  runWeekly: (p) => ipcRenderer.invoke("run-weekly", p),

  onWeeklyStdout: (cb) => sub("py:weekly:stdout", cb),
  onWeeklyStderr: (cb) => sub("py:weekly:stderr", cb),
  onWeeklyExit: (cb) => sub("py:weekly:exit", cb),

  onOnchainStdout: (cb) => sub("py:onchain:stdout", cb),
  onOnchainStderr: (cb) => sub("py:onchain:stderr", cb),
  onOnchainExit: (cb) => sub("py:onchain:exit", cb),
});
