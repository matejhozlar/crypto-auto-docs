import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, "..", "..");
const appdata = path.resolve(__dirname, "..", "appdata");

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  try {
    fs.cpSync(src, dest, { recursive: true });
  } catch {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const e of entries) {
      const s = path.join(src, e.name);
      const d = path.join(dest, e.name);
      if (e.isDirectory()) {
        copyDir(s, d);
      } else {
        fs.copyFileSync(s, d);
      }
    }
  }
}

fs.mkdirSync(appdata, { recursive: true });

copyDir(path.join(repoRoot, "scripts"), path.join(appdata, "scripts"));
copyDir(path.join(repoRoot, "docs"), path.join(appdata, "docs"));
copyDir(
  path.join(repoRoot, "defillama-slugs"),
  path.join(appdata, "defillama-slugs")
);
copyDir(path.join(__dirname, "..", "bin"), path.join(appdata, "bin"));

const onchainSrc = path.join(repoRoot, "onchain.py");
if (fs.existsSync(onchainSrc)) {
  fs.copyFileSync(onchainSrc, path.join(appdata, "onchain.py"));
}

const envSrc = path.join(repoRoot, ".env");
if (fs.existsSync(envSrc)) {
  fs.copyFileSync(envSrc, path.join(appdata, ".env"));
}

console.log("[prepare-appdata] Copied scripts/docs into desktop/appdata");
