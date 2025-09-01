let state = {
  apiKey: "",
  mode: null,
  weeklyPath: "",
  monthlyPath: "",
  monthlyWeeklyPath: "",
  running: false,
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

window.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    $("#splash").classList.add("hidden");
    $("#app").classList.remove("hidden");
  }, 5000);

  wireTiles();
  wireModal();
  wireDrawer();
  wireLiveLogs();
});

function wireTiles() {
  $$(".tile").forEach((t) => {
    t.addEventListener("mouseenter", () => t.classList.add("hover"));
    t.addEventListener("mouseleave", () => t.classList.remove("hover"));
    t.addEventListener("click", () => openSetup(t.dataset.mode));
  });
}

function classifyLine(line, fallbackType) {
  const rules = [
    { re: /^\s*\[(OK|SUCCESS)\]\s*/i, level: "ok", badge: "OK" },
    { re: /^\s*\[(INFO|I)\]\s*/i, level: "info", badge: "INFO" },
    { re: /^\s*\[(WARN|WARNING|W)\]\s*/i, level: "warn", badge: "WARN" },
    { re: /^\s*\[(ERR|ERROR|E)\]\s*/i, level: "err", badge: "ERROR" },
  ];
  for (const { re, level, badge } of rules) {
    if (re.test(line)) return { level, badge, text: line.replace(re, "") };
  }
  if (fallbackType === "err")
    return { level: "err", badge: "ERROR", text: line };
  return { level: "out", badge: "stdout", text: line };
}

function openSetup(mode) {
  state.mode = mode;
  $("#modalTitle").textContent =
    mode === "weekly" ? "Weekly Performance" : "Monthly (On-Chain)";
  $("#weeklyFields").classList.toggle("hidden", mode !== "weekly");
  $("#monthlyFields").classList.toggle("hidden", mode !== "monthly");
  $("#apiKey").value = state.apiKey || "";
  $("#setupModal").classList.remove("hidden");
}

function wireModal() {
  $("#modalClose").addEventListener("click", closeModal);
  $("#modalCancel").addEventListener("click", closeModal);

  $("#pickWeekly").addEventListener("click", async () => {
    const p = await window.api.pickFile(
      "Choose Weekly_Performance_PORTFOLIO.xlsx"
    );
    if (p) {
      state.weeklyPath = p;
      $("#weeklyPath").value = p;
    }
  });

  $("#pickMonthly").addEventListener("click", async () => {
    const p = await window.api.pickFile("Choose Monthly_Performance_CVR.xlsx");
    if (p) {
      state.monthlyPath = p;
      $("#monthlyPath").value = p;
    }
  });

  $("#pickMonthlyWeekly").addEventListener("click", async () => {
    const p = await window.api.pickFile(
      "Choose Weekly_Performance_PORTFOLIO.xlsx"
    );
    if (p) {
      state.monthlyWeeklyPath = p;
      $("#monthlyWeeklyPath").value = p;
    }
  });

  $("#modalStart").addEventListener("click", startRunFromModal);
}

function closeModal() {
  $("#setupModal").classList.add("hidden");
}

async function startRunFromModal() {
  state.apiKey = $("#apiKey").value.trim();

  if (!state.apiKey) {
    alert("Please enter your CoinMarketCap API key.");
    return;
  }

  if (state.mode === "weekly") {
    if (!state.weeklyPath) {
      alert("Please choose the Weekly file.");
      return;
    }
  } else {
    if (!state.monthlyPath || !state.monthlyWeeklyPath) {
      alert("Please choose both Monthly and Weekly files.");
      return;
    }
  }

  closeModal();

  if (state.mode === "weekly") {
    runWeekly().catch(() => {});
  } else {
    runOnchain().catch(() => {});
  }
}

function showRunIcon(mode) {
  const el = $("#runIcon");
  el.className = "run-icon";
  el.textContent = "";
  if (mode === "spin") el.classList.add("spin");
  if (mode === "ok") {
    el.classList.add("ok");
    el.textContent = "✅";
  }
  if (mode === "err") {
    el.classList.add("err");
    el.textContent = "❌";
  }
}

function showStop(id) {
  const b = $("#btnStop");
  b.classList.remove("hidden");
  b.disabled = false;
  b.dataset.id = id;
}
function hideStop() {
  const b = $("#btnStop");
  b.classList.add("hidden");
  b.disabled = false;
  b.removeAttribute("data-id");
}

function updateRunStatus(state, text) {
  if (state === "running") {
    showRunIcon("spin");
    $("#runStatus").textContent = "Running…";
    return;
  }
  if (state === "ok") {
    showRunIcon("ok");
    $("#runStatus").textContent = "Done";
    return;
  }
  if (state === "err") {
    showRunIcon("err");
    $("#runStatus").textContent = "Failed";
    return;
  }
  if (state === "stopped") {
    showRunIcon("err");
    $("#runStatus").textContent = "Stopped";
    return;
  }
}

function wireDrawer() {
  $("#btnCollapse").addEventListener("click", () => {
    $("#logWrap").classList.toggle("hidden");
    $("#btnCollapse").textContent = $("#logWrap").classList.contains("hidden")
      ? "Expand"
      : "Collapse";
  });
  $("#btnCopy").addEventListener("click", () => {
    const text = Array.from($("#logList").querySelectorAll(".msg"))
      .map((n) => n.textContent)
      .join("\n");
    navigator.clipboard
      .writeText(text)
      .then(() => setStatus("Copied logs to clipboard."));
  });
  $("#btnClear").addEventListener("click", () => {
    $("#logList").innerHTML = "";
    setStatus("Cleared.");
  });
  $("#btnStop").addEventListener("click", async (e) => {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    e.currentTarget.disabled = true;
    setStatus("Stopping…");
    try {
      await window.api.stopRun(id);
    } catch {}
  });
}

function ensureDrawer(label) {
  $("#runLabel").textContent = label;
  $("#consoleDrawer").classList.remove("hidden");
  $("#logWrap").classList.remove("hidden");
  $("#btnCollapse").textContent = "Collapse";
  $("#download").hidden = true;
  $("#logList").innerHTML = "";
  updateRunStatus("running");
}

function setStatus(s) {
  $("#runStatus").textContent = s || "";
}

function addLog(type, chunk) {
  if (!chunk) return;
  const lines = chunk.replace(/\r/g, "").split("\n").filter(Boolean);
  const list = $("#logList");

  for (const raw of lines) {
    const { level, badge, text } = classifyLine(raw, type);
    const li = document.createElement("li");
    li.className = level === "out" ? "" : level;

    const b = document.createElement("span");
    b.className = "badge";
    b.textContent = badge;

    const msg = document.createElement("span");
    msg.className = "msg";
    msg.textContent = text;

    li.appendChild(b);
    li.appendChild(msg);
    list.appendChild(li);
  }

  const wrap = $("#logWrap");
  wrap.scrollTop = wrap.scrollHeight;
}

function wireLiveLogs() {
  if (window.api.onWeeklyStdout) {
    window.api.onWeeklyStdout((s) => addLog("out", s));
    window.api.onWeeklyStderr((s) => addLog("err", s));
    window.api.onWeeklyExit((code) => {
      hideStop();
      updateRunStatus(code === 0 ? "ok" : "err");
    });
    if (window.api.onWeeklyStopping) {
      window.api.onWeeklyStopping(() => {
        setStatus("Stopping…");
      });
    }
  }
  if (window.api.onOnchainStdout) {
    window.api.onOnchainStdout((s) => addLog("out", s));
    window.api.onOnchainStderr((s) => addLog("err", s));
    window.api.onOnchainExit((code) => {
      hideStop();
      updateRunStatus(code === 0 ? "ok" : "err");
    });
    if (window.api.onOnchainStopping) {
      window.api.onOnchainStopping(() => {
        setStatus("Stopping…");
      });
    }
  }
}

async function runWeekly() {
  if (state.running) return;
  state.running = true;
  ensureDrawer("Weekly Performance");
  showStop("weekly");
  try {
    const res = await window.api.runWeekly({
      apiKey: state.apiKey,
      weeklyPath: state.weeklyPath,
    });
    if (res && res.exists) {
      const a = $("#download");
      a.hidden = false;
      a.textContent = "Download result";
      a.href = "file://" + res.outputPath;
    }
  } catch (e) {
    addLog("err", String(e));
    updateRunStatus("err");
  } finally {
    state.running = false;
  }
}

async function runOnchain() {
  if (state.running) return;
  state.running = true;
  ensureDrawer("Monthly (On-Chain)");
  showStop("monthly");
  try {
    const res = await window.api.runOnchain({
      apiKey: state.apiKey,
      monthlyPath: state.monthlyPath,
      weeklyPath: state.monthlyWeeklyPath,
    });
    if (res && res.exists) {
      const a = $("#download");
      a.hidden = false;
      a.textContent = "Download result";
      a.href = "file://" + res.outputPath;
    }
  } catch (e) {
    addLog("err", String(e));
    updateRunStatus("err");
  } finally {
    state.running = false;
  }
}
