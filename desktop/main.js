import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  nativeTheme,
  Menu,
} from "electron";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { spawn, execFileSync } from "child_process";
import { createRequire } from "module";

const settingsFile = () => path.join(app.getPath("userData"), "settings.json");

function loadSettings() {
  try {
    return JSON.parse(fs.readFileSync(settingsFile(), "utf8"));
  } catch {
    return {};
  }
}

function saveSettings(patch = {}) {
  const next = { ...loadSettings(), ...patch };
  fs.mkdirSync(path.dirname(settingsFile()), { recursive: true });
  fs.writeFileSync(settingsFile(), JSON.stringify(next, null, 2));
  return next;
}

const require = createRequire(import.meta.url);
if (process.platform === "win32") {
  if (require("electron-squirrel-startup")) {
    process.exit(0);
  }
}

const running = new Map();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const devBase = path.resolve(__dirname, "..");
const pkgBase = path.join(app.getAppPath(), "appdata");

const base = app.isPackaged ? pkgBase : devBase;

const projectRoot = base;
const pythonScriptsCwd = projectRoot;
const docsDir = path.join(projectRoot, "docs");
const scriptsDir = path.join(projectRoot, "scripts");

function resolveWorker(name) {
  const binName = process.platform === "win32" ? `${name}.exe` : name;
  const devPath = path.join(
    __dirname,
    "bin",
    process.platform === "win32" ? "win" : "darwin",
    binName
  );
  const pkgPath = path.join(
    base,
    "bin",
    process.platform === "win32" ? "win" : "darwin",
    binName
  );
  return fs.existsSync(pkgPath) ? pkgPath : devPath;
}

function runWorkerStream({ name, args = [], cwd, env = {}, sender, id }) {
  const exe = resolveWorker(name);
  const child = spawn(exe, args, {
    cwd: cwd ?? scriptsDir,
    env: { ...process.env, ...env },
  });
  running.set(id, child);
  const ch = (t) => `py:${id}:${t}`;
  sender.send(ch("start"), { pid: child.pid });
  child.stdout.on("data", (d) => sender.send(ch("stdout"), d.toString()));
  child.stderr.on("data", (d) => sender.send(ch("stderr"), d.toString()));
  return new Promise((resolve, reject) => {
    child.on("close", (code) => {
      running.delete(id);
      sender.send(ch("exit"), code);
      if (code === 0) resolve();
      else reject(new Error(`${name} exited with code ${code}`));
    });
  });
}

function terminateProcess(child) {
  return new Promise((resolve) => {
    const done = () => resolve();
    let finished = false;
    const finishOnce = () => {
      if (!finished) {
        finished = true;
        done();
      }
    };

    child.once("close", finishOnce);
    try {
      if (process.platform === "win32") {
        const killer = spawn("taskkill", [
          "/PID",
          String(child.pid),
          "/T",
          "/F",
        ]);
        killer.once("close", finishOnce);
      } else {
        child.kill("SIGTERM");
        setTimeout(() => {
          if (!finished) {
            try {
              child.kill("SIGKILL");
            } catch {}
          }
        }, 1200);
      }
    } catch {
      finishOnce();
    }
  });
}

async function ensureDocsInputs({ monthlyPath, weeklyPath }) {
  fs.mkdirSync(docsDir, { recursive: true });
  if (monthlyPath)
    fs.copyFileSync(
      monthlyPath,
      path.join(docsDir, "Monthly_Performance_CVR.xlsx")
    );
  if (weeklyPath)
    fs.copyFileSync(
      weeklyPath,
      path.join(docsDir, "Weekly_Performance_PORTFOLIO.xlsx")
    );
}

async function writeDotEnv(apiKey) {
  if (!apiKey) return;
  const envContent = `API_KEY=${apiKey}\n`;
  fs.writeFileSync(path.join(projectRoot, ".env"), envContent);
  fs.writeFileSync(path.join(scriptsDir, ".env"), envContent);
}

async function handleRunWeekly(event, payload) {
  const { apiKey: incomingKey, weeklyPath } = payload;
  const saved = loadSettings();
  const apiKey = String(incomingKey || saved.apiKey || "")
    .trim()
    .replace(/^['"]|['"]$/g, "");
  if (incomingKey && incomingKey !== saved.apiKey) saveSettings({ apiKey });
  if (!weeklyPath) throw new Error("Please select the Weekly file.");
  await writeDotEnv(apiKey);
  await ensureDocsInputs({ weeklyPath });

  await runWorkerStream({
    name: "weekly_updater",
    cwd: scriptsDir,
    env: { APP_BASE: projectRoot, DOCS_DIR: docsDir, API_KEY: apiKey },
    sender: event.sender,
    id: "weekly",
  });

  const output = path.join(docsDir, "Weekly_Performance_PORTFOLIO_latest.xlsx");
  return { outputPath: output, exists: fs.existsSync(output) };
}

async function handleRunOnchain(event, payload) {
  const { apiKey: incomingKey, monthlyPath } = payload;
  const saved = loadSettings();
  const apiKey = String(incomingKey || saved.apiKey || "")
    .trim()
    .replace(/^['"]|['"]$/g, "");
  if (incomingKey && incomingKey !== saved.apiKey) saveSettings({ apiKey });
  if (!monthlyPath) throw new Error("Please select the Monthly file.");

  await writeDotEnv(apiKey);
  await ensureDocsInputs({ monthlyPath });

  await runWorkerStream({
    name: "monthly_updater",
    cwd: projectRoot,
    env: { APP_BASE: projectRoot, DOCS_DIR: docsDir, API_KEY: apiKey },
    sender: event.sender,
    id: "monthly",
  });

  const output = path.join(docsDir, "Weekly_Performance_updated.xlsx");
  return { outputPath: output, exists: fs.existsSync(output) };
}

function createWindow() {
  const assetsDir = path.join(__dirname, "assets");
  const iconPath =
    process.platform === "win32"
      ? path.join(assetsDir, "icon.ico")
      : process.platform === "darwin"
        ? path.join(assetsDir, "icon.icns")
        : path.join(assetsDir, "icon.png");

  const win = new BrowserWindow({
    width: 900,
    height: 650,
    title: "Crypto Auto Docs",
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    backgroundColor: "#121212",
    darkTheme: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : undefined,
  });

  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, "renderer.html"));
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  nativeTheme.themeSource = "dark";

  ipcMain.handle("pick-file", async (_e, { title }) => {
    const res = await dialog.showOpenDialog({
      title,
      properties: ["openFile"],
    });
    return res.canceled ? null : res.filePaths[0] || null;
  });

  ipcMain.handle("settings:get", () => loadSettings());
  ipcMain.handle("settings:set", (_e, patch) => saveSettings(patch));
  ipcMain.handle("run-monthly", handleRunOnchain);
  ipcMain.handle("run-weekly", handleRunWeekly);
  ipcMain.handle("stop-run", async (event, { id }) => {
    const child = running.get(id);
    if (!child) return { ok: false, reason: "not-running" };
    event.sender.send(`py:${id}:stopping`);
    await terminateProcess(child);
    return { ok: true };
  });

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
