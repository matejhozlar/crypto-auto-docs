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
import { create } from "domain";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");
const pythonScriptsCwd = projectRoot;
const docsDir = path.join(projectRoot, "docs");
const scriptsDir = path.join(projectRoot, "scripts");

function getPythonCmd() {
  const candidates =
    process.platform === "win32"
      ? ["py", "python", "python3"]
      : ["python3", "python"];
  for (const cmd of candidates) {
    try {
      execFileSync(cmd, ["--version"], { stdio: "ignore" });
      return cmd;
    } catch {}
  }
  return "python3";
}

function runPython(entry, args = [], extraEnv = {}, cwdOverride) {
  return new Promise((resolve, reject) => {
    const py = getPythonCmd();
    const child = spawn(py, [entry, ...args], {
      cwd: cwdOverride ?? pythonScriptsCwd,
      env: {
        ...process.env,
        ...extraEnv,
        PYTHONUTF8: "1",
        PYTHONIOENCODING: "utf-8",
      },
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => {
      stdout += d.toString();
    });
    child.stderr.on("data", (d) => {
      stderr += d.toString();
    });

    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr || `Exited with code ${code}`));
    });
  });
}

function runPythonStream({ entry, args = [], cwd, env = {}, sender, id }) {
  const py = getPythonCmd();
  const child = spawn(py, ["-u", entry, ...args], {
    cwd: cwd ?? pythonScriptsCwd,
    env: {
      ...process.env,
      ...env,
      PYTHONUTF8: "1",
      PYTHONIOENCODING: "utf-8",
      PYTHONUNBUFFERED: "1",
    },
  });

  const ch = (t) => `py:${id}:${t}`;

  sender.send(ch("start"), { pid: child.pid });

  child.stdout.on("data", (d) => sender.send(ch("stdout"), d.toString()));
  child.stderr.on("data", (d) => sender.send(ch("stderr"), d.toString()));

  return new Promise((resolve, reject) => {
    child.on("close", (code) => {
      sender.send(ch("exit"), code);
      if (code === 0) resolve();
      else reject(new Error(`Python exited with code ${code}`));
    });
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
  const { apiKey, weeklyPath } = payload;
  if (!weeklyPath) throw new Error("Please select the Weekly file.");
  await writeDotEnv(apiKey);
  await ensureDocsInputs({ weeklyPath });

  await runPythonStream({
    entry: "performance_table_update_prices.py",
    cwd: scriptsDir,
    sender: event.sender,
    id: "weekly",
  });

  const output = path.join(docsDir, "Weekly_Performance_PORTFOLIO_latest.xlsx");
  return { outputPath: output, exists: fs.existsSync(output) };
}

async function handleRunOnchain(event, payload) {
  const { apiKey, monthlyPath, weeklyPath } = payload;
  if (!monthlyPath || !weeklyPath)
    throw new Error("Please select both Monthly and Weekly files.");
  await writeDotEnv(apiKey);
  await ensureDocsInputs({ monthlyPath, weeklyPath });

  await runPythonStream({
    entry: "onchain.py",
    cwd: projectRoot,
    sender: event.sender,
    id: "onchain",
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

  ipcMain.handle("run-onchain", handleRunOnchain);
  ipcMain.handle("run-weekly", handleRunWeekly);

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
